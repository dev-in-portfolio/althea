from django.contrib import admin
from .models import Collection, Asset, Tag, AssetTag, Favorite


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    search_fields = ("name", "owner__username", "owner__email")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner")
    search_fields = ("name", "owner__username", "owner__email")


class AssetTagInline(admin.TabularInline):
    model = AssetTag
    extra = 1


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "caption", "created_at")
    list_filter = ("collection",)
    search_fields = ("caption",)
    inlines = [AssetTagInline]
    actions = ["add_blueprint_tag"]

    def add_blueprint_tag(self, request, queryset):
        tag, _ = Tag.objects.get_or_create(owner=request.user, name="blueprint")
        for asset in queryset:
            AssetTag.objects.get_or_create(asset=asset, tag=tag)

    add_blueprint_tag.short_description = "Add blueprint tag to selected assets"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "asset", "created_at")
