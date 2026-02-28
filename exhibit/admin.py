from django.contrib import admin
from .models import Exhibit, ExhibitCard, Collection, CollectionItem


class ExhibitCardInline(admin.TabularInline):
    model = ExhibitCard
    extra = 1


@admin.register(Exhibit)
class ExhibitAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "status", "updated_at")
    list_filter = ("status", "owner")
    inlines = [ExhibitCardInline]
    actions = ["publish_selected", "unpublish_selected"]

    def publish_selected(self, request, queryset):
        queryset.update(status="published")

    def unpublish_selected(self, request, queryset):
        queryset.update(status="draft")

    publish_selected.short_description = "Publish selected exhibits"
    unpublish_selected.short_description = "Unpublish selected exhibits"


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at")


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ("collection", "exhibit", "order")
