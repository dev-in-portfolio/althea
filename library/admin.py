from django.contrib import admin
from .models import BlueprintEntry, Category, Tag, EntryLink, EntrySection


class EntrySectionInline(admin.TabularInline):
    model = EntrySection
    extra = 1


class EntryLinkInline(admin.TabularInline):
    model = EntryLink
    fk_name = "from_entry"
    extra = 1


@admin.register(BlueprintEntry)
class BlueprintEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "created_at")
    search_fields = ("title", "summary", "body")
    filter_horizontal = ("categories", "tags")
    inlines = [EntrySectionInline, EntryLinkInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")

