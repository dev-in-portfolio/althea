from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("exhibits/new/", views.new_exhibit, name="new_exhibit"),
    path("exhibits/<int:exhibit_id>/edit/", views.edit_exhibit, name="edit_exhibit"),
    path("collections/", views.collections, name="collections"),
    path("collections/<int:collection_id>/", views.collection_detail, name="collection_detail"),
    path("p/<slug:published_slug>/", views.public_exhibit, name="public_exhibit"),
]
