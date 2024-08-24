import os

# Obtén el directorio actual
directorio = os.getcwd()

# Archivo de salida
archivo_md = 'codigo_documentacion.md'

# Tipos de archivo a incluir
tipos_archivos = ['.py', '.html', '.js', '.css']

with open(archivo_md, 'w') as md_file:
    md_file.write('# Documentación del Código\n\n')

    for root, dirs, files in os.walk(directorio):
        # Filtrar directorios que comienzan con '.' para que no sean recorridos
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        for archivo in files:
            # Ignorar archivos que comienzan con '.'
            if archivo.startswith('.'):
                continue

            # Verifica si el archivo tiene una extensión de interés
            if any(archivo.endswith(ext) for ext in tipos_archivos):
                # Escribe el nombre del archivo y su contenido en el archivo .md
                ruta_completa = os.path.join(root, archivo)
                md_file.write(f'## {ruta_completa}\n')
                with open(ruta_completa, 'r') as file:
                    codigo = file.read()
                    md_file.write('```')
                    if archivo.endswith('.py'):
                        md_file.write('python')
                    elif archivo.endswith('.html'):
                        md_file.write('html')
                    elif archivo.endswith('.js'):
                        md_file.write('javascript')
                    elif archivo.endswith('.css'):
                        md_file.write('css')
                    md_file.write('\n')
                    md_file.write(codigo)
                    md_file.write('```\n\n')
