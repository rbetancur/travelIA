"""
Módulo para generar PDFs de itinerarios de viaje.
"""
import json
import re
from io import BytesIO
from typing import List, Dict, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from PIL import Image as PILImage
import requests
from xml.sax.saxutils import escape


def escape_xml_text(text: str) -> str:
    """
    Escapa caracteres especiales para XML/HTML de forma segura.
    Asegura que el texto esté en UTF-8 y escapa caracteres que pueden causar problemas.
    
    Args:
        text: Texto a escapar
        
    Returns:
        Texto escapado y codificado correctamente
    """
    if not text:
        return ""
    
    # Asegurar que el texto sea string y esté en UTF-8
    if isinstance(text, bytes):
        text = text.decode('utf-8', errors='replace')
    elif not isinstance(text, str):
        text = str(text)
    
    # Escapar caracteres XML especiales
    text = escape(text, {
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    })
    
    # Reemplazar caracteres de control que pueden causar problemas
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    
    return text


def parse_json_from_text(text: str) -> Optional[Dict]:
    """
    Intenta extraer y parsear JSON de un texto.
    """
    try:
        # Buscar JSON en el texto
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        # Intentar parsear todo el texto como JSON
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return None


def extract_sections_from_history(messages: List[Dict]) -> Dict[str, List[str]]:
    """
    Extrae todas las secciones de recomendaciones del historial de conversación.
    
    Args:
        messages: Lista de mensajes del historial
        
    Returns:
        Diccionario con secciones agrupadas: {
            'alojamiento': [...],
            'comida_local': [...],
            'lugares_imperdibles': [...],
            'consejos_locales': [...],
            'estimacion_costos': [...]
        }
    """
    sections = {
        'alojamiento': [],
        'comida_local': [],
        'lugares_imperdibles': [],
        'consejos_locales': [],
        'estimacion_costos': []
    }
    
    # Buscar solo en respuestas del asistente
    for msg in messages:
        if msg.get('role') == 'assistant':
            content = msg.get('content', '')
            json_data = parse_json_from_text(content)
            
            if json_data and isinstance(json_data, dict):
                for key in sections.keys():
                    if key in json_data and isinstance(json_data[key], list):
                        # Agregar recomendaciones únicas
                        for item in json_data[key]:
                            if isinstance(item, str) and item.strip() and item not in sections[key]:
                                sections[key].append(item.strip())
    
    return sections


def download_image(url: str, max_size: tuple = (800, 600)) -> Optional[BytesIO]:
    """
    Descarga una imagen desde una URL y la redimensiona si es necesario.
    
    Args:
        url: URL de la imagen
        max_size: Tamaño máximo (ancho, alto)
        
    Returns:
        BytesIO con la imagen o None si hay error
    """
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            img = PILImage.open(BytesIO(response.content))
            # Convertir a RGB si es necesario
            if img.mode != 'RGB':
                img = img.convert('RGB')
            # Redimensionar si es muy grande
            img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG', quality=85)
            img_bytes.seek(0)
            return img_bytes
    except Exception as e:
        print(f"⚠️ Error al descargar imagen {url}: {e}")
    return None


def create_pdf(
    destination: str,
    departure_date: Optional[str],
    return_date: Optional[str],
    messages: List[Dict],
    photos: Optional[List[Dict]] = None,
    output: BytesIO = None
) -> BytesIO:
    """
    Crea un PDF con el itinerario de viaje.
    
    Args:
        destination: Nombre del destino
        departure_date: Fecha de salida (opcional)
        return_date: Fecha de regreso (opcional)
        messages: Historial de mensajes de la conversación
        photos: Lista de fotos del destino (opcional)
        output: BytesIO donde escribir el PDF (si None, crea uno nuevo)
        
    Returns:
        BytesIO con el PDF generado
    """
    if output is None:
        output = BytesIO()
    
    # Crear documento
    doc = SimpleDocTemplate(output, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    story = []
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para el título principal
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=20,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para secciones
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=16,
        fontName='Helvetica-Bold'
    )
    
    # Estilo para texto normal
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    # Estilo para items de lista
    item_style = ParagraphStyle(
        'ItemStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=6,
        leftIndent=20,
        bulletIndent=10,
        alignment=TA_LEFT,
        leading=12
    )
    
    # Header con logo y título
    header_text = f"<b>ViajeIA</b><br/><font size='12' color='#6b7280'>Tu Asistente Personal de Viajes</font>"
    story.append(Paragraph(header_text, title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Información del destino
    escaped_destination = escape_xml_text(destination)
    destination_text = f"<b>Destino:</b> {escaped_destination}"
    story.append(Paragraph(destination_text, subtitle_style))
    
    # Fechas
    if departure_date or return_date:
        dates_text = ""
        if departure_date:
            escaped_departure = escape_xml_text(departure_date)
            dates_text += f"<b>Salida:</b> {escaped_departure}"
        if return_date:
            if dates_text:
                dates_text += " | "
            escaped_return = escape_xml_text(return_date)
            dates_text += f"<b>Regreso:</b> {escaped_return}"
        story.append(Paragraph(dates_text, normal_style))
        story.append(Spacer(1, 0.2*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Fotos del destino
    if photos and len(photos) > 0:
        story.append(Paragraph("<b>Fotos del Destino</b>", section_style))
        
        # Crear tabla para las fotos (máximo 3 por fila)
        photo_data = []
        photo_row = []
        
        for i, photo in enumerate(photos[:6]):  # Máximo 6 fotos
            photo_url = photo.get('url') or photo.get('url_small') or photo.get('url_full')
            if photo_url:
                img_bytes = download_image(photo_url, max_size=(300, 200))
                if img_bytes:
                    try:
                        img = Image(img_bytes, width=2*inch, height=1.5*inch)
                        photo_row.append(img)
                        if len(photo_row) == 3 or i == len(photos[:6]) - 1:
                            photo_data.append(photo_row)
                            photo_row = []
                    except Exception as e:
                        print(f"⚠️ Error al agregar imagen al PDF: {e}")
        
        if photo_data:
            photo_table = Table(photo_data, colWidths=[2*inch, 2*inch, 2*inch])
            photo_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(photo_table)
            story.append(Spacer(1, 0.3*inch))
    
    # Extraer secciones del historial
    sections = extract_sections_from_history(messages)
    
    # Mapeo de secciones a títulos en español
    section_titles = {
        'alojamiento': '🏨 ALOJAMIENTO',
        'comida_local': '🍽️ COMIDA LOCAL',
        'lugares_imperdibles': '📍 LUGARES IMPERDIBLES',
        'consejos_locales': '💡 CONSEJOS LOCALES',
        'estimacion_costos': '💰 ESTIMACIÓN DE COSTOS'
    }
    
    # Agregar cada sección al PDF
    for section_key, title in section_titles.items():
        items = sections.get(section_key, [])
        if items:
            story.append(Paragraph(title, section_style))
            
            for item in items:
                # Escapar caracteres especiales correctamente
                escaped_item = escape_xml_text(item)
                story.append(Paragraph(f"• {escaped_item}", item_style))
            
            story.append(Spacer(1, 0.15*inch))
    
    # Si no hay secciones estructuradas, agregar el historial completo
    has_structured = any(sections.values())
    if not has_structured:
        story.append(Paragraph("<b>Historial de Conversación</b>", section_style))
        for msg in messages:
            role = msg.get('role', '')
            content = msg.get('content', '')
            if content:
                role_text = "Usuario" if role == 'user' else "Alex"
                escaped_content = escape_xml_text(content)
                # Limitar longitud y agregar puntos suspensivos si es necesario
                if len(escaped_content) > 500:
                    escaped_content = escaped_content[:500] + "..."
                story.append(Paragraph(f"<b>{role_text}:</b> {escaped_content}", normal_style))
                story.append(Spacer(1, 0.1*inch))
    
    # Footer
    story.append(Spacer(1, 0.3*inch))
    footer_text = "<font size='9' color='#9ca3af'>Generado por ViajeIA - Tu Asistente Personal de Viajes</font>"
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER)))
    
    # Construir PDF
    doc.build(story)
    output.seek(0)
    
    return output

