"""
Workaround para Python 3.9: fuerza el uso de importlib-metadata instalado
en lugar de la versión de la biblioteca estándar que no tiene packages_distributions.
Este archivo debe importarse antes que cualquier otra dependencia.
"""
import sys

if sys.version_info < (3, 10):
    try:
        # Intentar usar importlib_metadata del paquete instalado
        import importlib_metadata
        # Verificar si tiene packages_distributions
        if hasattr(importlib_metadata, 'packages_distributions'):
            # Reemplazar importlib.metadata con la versión del paquete
            # Primero asegurarse de que importlib.metadata existe
            import importlib
            if not hasattr(importlib, 'metadata'):
                # Si no existe, crear el módulo
                import types
                importlib.metadata = types.ModuleType('metadata')
            sys.modules['importlib.metadata'] = importlib_metadata
            # También actualizar el atributo en importlib
            importlib.metadata = importlib_metadata
    except (ImportError, AttributeError):
        # Si importlib-metadata no está instalado o hay un error, usar la versión estándar
        pass

