import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Crea o actualiza la única cuenta de administración a partir de DJANGO_SUPERUSER_USERNAME, "
        "DJANGO_SUPERUSER_EMAIL y DJANGO_SUPERUSER_PASSWORD. Sin esas variables no hace nada."
    )

    def handle(self, *args, **opts):
        usuario = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        clave = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if not usuario or not clave:
            self.stdout.write("Sin DJANGO_SUPERUSER_USERNAME/PASSWORD; no se modificó ninguna cuenta.")
            return
        User = get_user_model()
        u, creado = User.objects.get_or_create(username=usuario)
        u.email = os.environ.get("DJANGO_SUPERUSER_EMAIL", u.email)
        u.is_staff = u.is_superuser = u.is_active = True
        u.set_password(clave)
        u.save()
        # Nadie más puede entrar al panel
        otros = User.objects.exclude(pk=u.pk).filter(is_staff=True).update(is_staff=False, is_superuser=False)
        self.stdout.write(self.style.SUCCESS(f"Cuenta «{usuario}» {'creada' if creado else 'actualizada'}; {otros} cuentas sin acceso."))
