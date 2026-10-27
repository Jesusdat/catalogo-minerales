from django.urls import path

from . import views

app_name = "catalogo"

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("minerales/", views.catalogo, name="catalogo"),
    path("minerales/<slug:slug>/", views.ficha, name="ficha"),
    path("identificar/", views.identificador, name="identificar"),
    path("elementos/", views.elementos, name="elementos"),
    path("mapa/", views.mapa, name="mapa"),
    path("comparar/", views.comparar, name="comparar"),
    path("favoritos/", views.favoritos, name="favoritos"),
    path("acerca/", views.acerca, name="acerca"),
    path("sesion/<str:clave>/<slug:slug>/", views.alternar, name="alternar"),
    path("sesion/<str:clave>/vaciar", views.vaciar, name="vaciar"),
    path("fotos/<slug:slug>.webp", views.foto, name="foto"),
    path("api/minerales/", views.api_minerales, name="api_minerales"),
    path("api/minerales/<slug:slug>/", views.api_mineral, name="api_mineral"),
]
