release: python manage.py migrate --noinput && python manage.py cargar_catalogo && python manage.py crear_admin
web: gunicorn gabinete.wsgi
