from django.conf import settings
from django.db import models


class Collection(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "name"]),
        ]

    def __str__(self) -> str:
        return self.name


class Tag(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)

    class Meta:
        unique_together = ("owner", "name")
        indexes = [
            models.Index(fields=["owner", "name"]),
        ]

    def __str__(self) -> str:
        return self.name


class Asset(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="assets")
    file = models.ImageField(upload_to="assets/")
    caption = models.CharField(max_length=240, blank=True)
    tags = models.ManyToManyField(Tag, through="AssetTag", related_name="assets")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["collection", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.collection.name} - {self.id}"


class AssetTag(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("asset", "tag")


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "asset")
