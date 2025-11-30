"""
Configuración centralizada del sistema de logging para TravelIA.
Proporciona logging tanto en archivo como en consola con rotación de archivos.
"""
import logging
from logging.handlers import RotatingFileHandler
import os


def setup_logger(name: str = 'travelia', log_level: int = logging.INFO) -> logging.Logger:
    """
    Configura y retorna un logger con handlers para archivo y consola.
    
    Args:
        name: Nombre del logger
        log_level: Nivel de logging (default: INFO)
        
    Returns:
        Logger configurado
    """
    # Crear directorio de logs si no existe
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Obtener o crear logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Evitar duplicar handlers si ya está configurado
    if logger.handlers:
        return logger
    
    # Handler para archivo con rotación
    log_file = os.path.join(log_dir, 'app.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    
    # Handler para consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Formato de logs
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Añadir handlers al logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

