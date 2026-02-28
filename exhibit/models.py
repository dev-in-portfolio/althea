from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Exhibit(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    published_slug = models.SlugField(max_length=32, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("owner", "slug")
        indexes = [
            models.Index(fields=["owner", "status", "updated_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        if self.status == "published" and not self.published_slug:
            self.published_slug = slugify(f"{self.title}-{self.owner_id}")[:32]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class ExhibitCard(models.Model):
    CARD_TYPES = [
        ("text", "Text"),
        ("image", "Image"),
        ("embed", "Embed"),
        ("quote", "Quote"),
    ]

    exhibit = models.ForeignKey(Exhibit, related_name="cards", on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=CARD_TYPES)
    order = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    image = models.ImageField(upload_to="exhibit_cards/", blank=True)
    embed_url = models.URLField(blank=True)

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["exhibit", "order"]),
        ]


class Collection(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class CollectionItem(models.Model):
    collection = models.ForeignKey(Collection, related_name="items", on_delete=models.CASCADE)
    exhibit = models.ForeignKey(Exhibit, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = ("collection", "exhibit")
