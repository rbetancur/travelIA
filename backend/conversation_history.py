"""
Módulo para gestionar el historial de conversaciones.
Permite mantener contexto entre múltiples preguntas del usuario.
"""
from typing import List, Dict, Optional
from datetime import datetime
import uuid
from security import sanitize_conversation_history


class ConversationMessage:
    """Representa un mensaje en la conversación"""
    
    def __init__(self, role: str, content: str, timestamp: Optional[datetime] = None):
        self.role = role  # 'user' o 'assistant'
        self.content = content
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self) -> Dict:
        """Convierte el mensaje a diccionario"""
        return {
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ConversationMessage':
        """Crea un mensaje desde un diccionario"""
        timestamp = datetime.fromisoformat(data['timestamp']) if 'timestamp' in data else datetime.now()
        return cls(
            role=data['role'],
            content=data['content'],
            timestamp=timestamp
        )


class ConversationHistory:
    """Gestiona el historial de conversaciones por sesión"""
    
    def __init__(self, max_messages: int = 20):
        """
        Args:
            max_messages: Número máximo de mensajes a mantener por conversación
        """
        self.conversations: Dict[str, List[ConversationMessage]] = {}
        self.current_destinations: Dict[str, str] = {}  # Rastrea el destino actual por sesión
        self.pending_confirmations: Dict[str, Dict] = {}  # Rastrea confirmaciones pendientes por sesión
        self.max_messages = max_messages
    
    def create_session(self) -> str:
        """Crea una nueva sesión de conversación y devuelve su ID"""
        session_id = str(uuid.uuid4())
        self.conversations[session_id] = []
        return session_id
    
    def add_message(self, session_id: str, role: str, content: str) -> None:
        """
        Añade un mensaje a la conversación
        
        Args:
            session_id: ID de la sesión
            role: 'user' o 'assistant'
            content: Contenido del mensaje
        """
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        
        message = ConversationMessage(role=role, content=content)
        self.conversations[session_id].append(message)
        
        # Limitar el número de mensajes
        if len(self.conversations[session_id]) > self.max_messages:
            # Mantener los últimos max_messages mensajes
            self.conversations[session_id] = self.conversations[session_id][-self.max_messages:]
    
    def get_history(self, session_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Obtiene el historial de una conversación
        
        Args:
            session_id: ID de la sesión
            limit: Número máximo de mensajes a devolver (None = todos)
        
        Returns:
            Lista de mensajes en formato diccionario
        """
        if session_id not in self.conversations:
            return []
        
        messages = self.conversations[session_id]
        if limit:
            messages = messages[-limit:]
        
        return [msg.to_dict() for msg in messages]
    
    def get_conversation_context(self, session_id: str, limit: Optional[int] = None) -> str:
        """
        Obtiene el contexto de la conversación como texto formateado
        para incluir en el prompt. Sanitiza el historial para prevenir prompt injection.
        
        Args:
            session_id: ID de la sesión
            limit: Número máximo de mensajes a incluir (None = todos)
        
        Returns:
            String con el contexto formateado y sanitizado
        """
        messages = self.get_history(session_id, limit)
        
        if not messages:
            return ""
        
        # Sanitizar el historial usando la función de seguridad
        sanitized_context = sanitize_conversation_history(
            messages,
            max_message_length=1000,
            max_total_length=5000
        )
        
        return sanitized_context
    
    def extract_last_destination(self, session_id: str) -> Optional[str]:
        """
        Extrae el último destino mencionado en la conversación
        Busca tanto en preguntas del usuario como en respuestas del asistente
        
        Args:
            session_id: ID de la sesión
        
        Returns:
            String con el destino o None si no se encuentra
        """
        import re
        messages = self.get_history(session_id)
        
        # Buscar en orden inverso (más reciente primero)
        for msg in reversed(messages):
            content = msg['content']
            
            # Buscar patrones comunes de destinos en formato "Ciudad, País"
            patterns = [
                r'viajar a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+(?:,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)?)',
                r'destino[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+(?:,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)?)',
                r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)',  # Formato "Ciudad, País"
            ]
            
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    destination = match.group(1).strip()
                    # Validar que parece un destino (tiene coma)
                    if ',' in destination:
                        return destination
            
            # También buscar en respuestas del asistente que pueden contener el destino en el JSON
            # Buscar en formato JSON: "alojamiento": ["Hotel en Roma, Italia"]
            json_pattern = r'["\']([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*,\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)["\']'
            json_matches = re.finditer(json_pattern, content, re.IGNORECASE)
            for match in json_matches:
                destination = match.group(1).strip()
                if ',' in destination:
                    return destination
        
        return None
    
    def clear_session(self, session_id: str) -> None:
        """Limpia el historial de una sesión"""
        if session_id in self.conversations:
            self.conversations[session_id] = []
    
    def delete_session(self, session_id: str) -> None:
        """Elimina completamente una sesión"""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def get_all_sessions(self) -> List[str]:
        """Obtiene la lista de todos los IDs de sesión"""
        return list(self.conversations.keys())
    
    def get_session_stats(self, session_id: str) -> Dict:
        """Obtiene estadísticas de una sesión"""
        if session_id not in self.conversations:
            return {
                'exists': False,
                'message_count': 0
            }
        
        messages = self.conversations[session_id]
        user_messages = [m for m in messages if m.role == 'user']
        assistant_messages = [m for m in messages if m.role == 'assistant']
        
        return {
            'exists': True,
            'message_count': len(messages),
            'user_messages': len(user_messages),
            'assistant_messages': len(assistant_messages),
            'last_message': messages[-1].timestamp.isoformat() if messages else None
        }
    
    def set_current_destination(self, session_id: str, destination: str, clear_history_on_change: bool = True) -> None:
        """
        Establece el destino actual de la conversación
        
        Args:
            session_id: ID de la sesión
            destination: Destino en formato "Ciudad, País"
            clear_history_on_change: Si True, limpia el historial si el destino cambia
        """
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        
        # Verificar si el destino está cambiando
        previous_destination = self.current_destinations.get(session_id)
        
        # Comparar destinos (normalizar para comparación)
        if previous_destination and clear_history_on_change:
            # Importar aquí para evitar importación circular
            from destination_detector import compare_destinations
            if not compare_destinations(previous_destination, destination):
                # El destino cambió, limpiar el historial
                print(f"🔄 [HISTORY] Destino cambió de '{previous_destination}' a '{destination}'")
                print(f"🧹 [HISTORY] Limpiando historial de conversación para sesión {session_id}")
                self.conversations[session_id] = []
        
        self.current_destinations[session_id] = destination
        print(f"📍 [HISTORY] Destino actual establecido para sesión {session_id}: {destination}")
    
    def get_current_destination(self, session_id: str) -> Optional[str]:
        """
        Obtiene el destino actual de la conversación
        
        Args:
            session_id: ID de la sesión
        
        Returns:
            String con el destino actual o None si no hay destino establecido
        """
        return self.current_destinations.get(session_id)
    
    def clear_current_destination(self, session_id: str) -> None:
        """
        Limpia el destino actual de una sesión
        
        Args:
            session_id: ID de la sesión
        """
        if session_id in self.current_destinations:
            del self.current_destinations[session_id]
            print(f"🧹 [HISTORY] Destino actual limpiado para sesión {session_id}")
    
    def set_pending_confirmation(self, session_id: str, detected_destination: str, current_destination: str, original_question: str) -> None:
        """
        Establece una confirmación pendiente para una sesión
        
        Args:
            session_id: ID de la sesión
            detected_destination: Destino detectado en la pregunta
            current_destination: Destino actual de la conversación
            original_question: Pregunta original que generó la confirmación
        """
        from datetime import datetime
        self.pending_confirmations[session_id] = {
            'detected_destination': detected_destination,
            'current_destination': current_destination,
            'original_question': original_question,
            'timestamp': datetime.now()
        }
        print(f"⏳ [HISTORY] Confirmación pendiente establecida para sesión {session_id}: {detected_destination}")
    
    def get_pending_confirmation(self, session_id: str) -> Optional[Dict]:
        """
        Obtiene la confirmación pendiente de una sesión
        
        Args:
            session_id: ID de la sesión
        
        Returns:
            Diccionario con información de la confirmación pendiente o None
        """
        return self.pending_confirmations.get(session_id)
    
    def clear_pending_confirmation(self, session_id: str) -> None:
        """
        Limpia la confirmación pendiente de una sesión
        
        Args:
            session_id: ID de la sesión
        """
        if session_id in self.pending_confirmations:
            del self.pending_confirmations[session_id]
            print(f"🧹 [HISTORY] Confirmación pendiente limpiada para sesión {session_id}")


class GlobalHistory:
    """Gestiona el historial global de conversaciones (últimas 10)"""
    
    def __init__(self, max_conversations: int = 10):
        """
        Args:
            max_conversations: Número máximo de conversaciones a mantener (FIFO)
        """
        self.conversations: List[Dict] = []
        self.max_conversations = max_conversations
    
    def add_conversation(self, pregunta: str, respuesta: str) -> None:
        """
        Añade una conversación al historial global
        
        Args:
            pregunta: Pregunta del usuario
            respuesta: Respuesta del asistente
        """
        conversation = {
            'pregunta': pregunta,
            'respuesta': respuesta,
            'timestamp': datetime.now().isoformat()
        }
        
        self.conversations.append(conversation)
        
        # Mantener solo las últimas max_conversations (FIFO)
        if len(self.conversations) > self.max_conversations:
            self.conversations = self.conversations[-self.max_conversations:]
        
        print(f"📝 [GLOBAL_HISTORY] Conversación añadida al historial global ({len(self.conversations)}/{self.max_conversations})")
    
    def get_history(self) -> List[Dict]:
        """
        Obtiene el historial completo de conversaciones
        
        Returns:
            Lista de conversaciones en formato diccionario
        """
        return self.conversations.copy()
    
    def clear(self) -> None:
        """Limpia el historial global"""
        self.conversations = []
        print(f"🧹 [GLOBAL_HISTORY] Historial global limpiado")


# Instancia global del historial de conversaciones por sesión
conversation_history = ConversationHistory(max_messages=20)

# Instancia global del historial global de conversaciones
global_history = GlobalHistory(max_conversations=10)

