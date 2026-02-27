from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("collections/", views.collections_list, name="collections"),
    path("collections/<int:collection_id>/", views.collection_detail, name="collection_detail"),
    path("assets/<int:asset_id>/", views.asset_detail, name="asset_detail"),
    path("search/", views.search, name="search"),
    path("favorites/", views.favorites, name="favorites"),
]
