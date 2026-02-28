from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("entries/", views.entries_list, name="entries"),
    path("entries/<slug:slug>/", views.entry_detail, name="entry_detail"),
    path("search/", views.search, name="search"),
]
