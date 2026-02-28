from django import forms
from .models import Exhibit, ExhibitCard, Collection, CollectionItem


class ExhibitForm(forms.ModelForm):
    class Meta:
        model = Exhibit
        fields = ["title", "summary", "status"]


class ExhibitCardForm(forms.ModelForm):
    class Meta:
        model = ExhibitCard
        fields = ["type", "order", "title", "body", "image", "embed_url"]


class CollectionForm(forms.ModelForm):
    class Meta:
        model = Collection
        fields = ["name", "description"]


class CollectionItemForm(forms.ModelForm):
    class Meta:
        model = CollectionItem
        fields = ["exhibit", "order"]
