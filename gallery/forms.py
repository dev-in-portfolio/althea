from django import forms
from .models import Collection, Asset, Tag


class CollectionForm(forms.ModelForm):
    class Meta:
        model = Collection
        fields = ["name"]


class AssetForm(forms.ModelForm):
    tags = forms.CharField(
        required=False,
        help_text="Comma-separated tags",
    )

    class Meta:
        model = Asset
        fields = ["file", "caption"]


class TagFilterForm(forms.Form):
    q = forms.CharField(required=False)
    tag = forms.CharField(required=False)
    collection = forms.ModelChoiceField(
        queryset=Collection.objects.none(),
        required=False
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields["collection"].queryset = Collection.objects.filter(owner=user)
