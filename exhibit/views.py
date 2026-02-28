from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import ExhibitForm, ExhibitCardForm, CollectionForm, CollectionItemForm
from .models import Exhibit, ExhibitCard, Collection


@login_required
def dashboard(request):
    drafts = Exhibit.objects.filter(owner=request.user, status="draft").order_by("-updated_at")[:6]
    published = Exhibit.objects.filter(owner=request.user, status="published").order_by("-updated_at")[:6]
    return render(request, "exhibit/dashboard.html", {"drafts": drafts, "published": published})


@login_required
def new_exhibit(request):
    if request.method == "POST":
        form = ExhibitForm(request.POST)
        if form.is_valid():
            exhibit = form.save(commit=False)
            exhibit.owner = request.user
            if exhibit.status == "published" and not exhibit.published_at:
                exhibit.published_at = timezone.now()
            exhibit.save()
            return redirect("edit_exhibit", exhibit.id)
    else:
        form = ExhibitForm()
    return render(request, "exhibit/new_exhibit.html", {"form": form})


@login_required
def edit_exhibit(request, exhibit_id):
    exhibit = get_object_or_404(Exhibit, id=exhibit_id, owner=request.user)
    if request.method == "POST" and "save_exhibit" in request.POST:
        form = ExhibitForm(request.POST, instance=exhibit)
        if form.is_valid():
            exhibit = form.save(commit=False)
            if exhibit.status == "published" and not exhibit.published_at:
                exhibit.published_at = timezone.now()
            exhibit.save()
            return redirect("edit_exhibit", exhibit_id)
    else:
        form = ExhibitForm(instance=exhibit)

    if request.method == "POST" and "add_card" in request.POST:
        card_form = ExhibitCardForm(request.POST, request.FILES)
        if card_form.is_valid():
            card = card_form.save(commit=False)
            card.exhibit = exhibit
            card.save()
            return redirect("edit_exhibit", exhibit_id)
    else:
        card_form = ExhibitCardForm()

    if request.method == "POST" and "move_up" in request.POST:
        card = ExhibitCard.objects.get(id=request.POST.get("move_up"))
        card.order = max(card.order - 1, 0)
        card.save()
        return redirect("edit_exhibit", exhibit_id)

    if request.method == "POST" and "move_down" in request.POST:
        card = ExhibitCard.objects.get(id=request.POST.get("move_down"))
        card.order += 1
        card.save()
        return redirect("edit_exhibit", exhibit_id)

    cards = exhibit.cards.all()
    return render(
        request,
        "exhibit/edit_exhibit.html",
        {"exhibit": exhibit, "form": form, "card_form": card_form, "cards": cards},
    )


@login_required
def collections(request):
    if request.method == "POST":
        form = CollectionForm(request.POST)
        if form.is_valid():
            collection = form.save(commit=False)
            collection.owner = request.user
            collection.save()
            return redirect("collections")
    else:
        form = CollectionForm()
    collections = Collection.objects.filter(owner=request.user)
    return render(request, "exhibit/collections.html", {"collections": collections, "form": form})


@login_required
def collection_detail(request, collection_id):
    collection = get_object_or_404(Collection, id=collection_id, owner=request.user)
    if request.method == "POST":
        form = CollectionItemForm(request.POST)
        form.fields["exhibit"].queryset = Exhibit.objects.filter(owner=request.user)
        if form.is_valid():
            item = form.save(commit=False)
            item.collection = collection
            item.save()
            return redirect("collection_detail", collection_id)
    else:
        form = CollectionItemForm()
        form.fields["exhibit"].queryset = Exhibit.objects.filter(owner=request.user)
    return render(
        request,
        "exhibit/collection_detail.html",
        {"collection": collection, "form": form, "items": collection.items.all()},
    )


def public_exhibit(request, published_slug):
    exhibit = get_object_or_404(Exhibit, published_slug=published_slug, status="published")
    return render(request, "exhibit/public_exhibit.html", {"exhibit": exhibit})
