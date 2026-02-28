from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self) -> str:
        return self.name


class Tag(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self) -> str:
        return self.name


class BlueprintEntry(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    summary = models.TextField(blank=True)
    body = models.TextField()
    categories = models.ManyToManyField(Category, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("owner", "slug")
        indexes = [
            models.Index(fields=["owner", "slug"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class EntryLink(models.Model):
    from_entry = models.ForeignKey(BlueprintEntry, related_name="outgoing_links", on_delete=models.CASCADE)
    to_entry = models.ForeignKey(BlueprintEntry, related_name="incoming_links", on_delete=models.CASCADE)
    relationship_type = models.CharField(max_length=64, default="related")

    class Meta:
        unique_together = ("from_entry", "to_entry", "relationship_type")

    def __str__(self) -> str:
        return f"{self.from_entry} -> {self.to_entry} ({self.relationship_type})"


class EntrySection(models.Model):
    entry = models.ForeignKey(BlueprintEntry, related_name="sections", on_delete=models.CASCADE)
    heading = models.CharField(max_length=140)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
