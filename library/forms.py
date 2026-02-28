from django import forms
from .models import BlueprintEntry, Category, Tag, EntryLink, EntrySection


class EntryForm(forms.ModelForm):
    categories = forms.ModelMultipleChoiceField(queryset=Category.objects.none(), required=False)
    tags = forms.ModelMultipleChoiceField(queryset=Tag.objects.none(), required=False)

    class Meta:
        model = BlueprintEntry
        fields = ["title", "summary", "body", "categories", "tags"]

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields["categories"].queryset = Category.objects.filter(owner=user)
            self.fields["tags"].queryset = Tag.objects.filter(owner=user)


class LinkForm(forms.ModelForm):
    class Meta:
        model = EntryLink
        fields = ["to_entry", "relationship_type"]


class SectionForm(forms.ModelForm):
    class Meta:
        model = EntrySection
        fields = ["heading", "content", "order"]
