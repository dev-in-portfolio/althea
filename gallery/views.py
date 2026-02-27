from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render

from .forms import AssetForm, CollectionForm, TagFilterForm
from .models import Asset, Collection, Favorite, Tag


@login_required
def dashboard(request):
    collections = (
        Collection.objects.filter(owner=request.user)
        .annotate(asset_count=Count("assets"))
        .order_by("-created_at")[:6]
    )
    assets = (
        Asset.objects.filter(collection__owner=request.user)
        .select_related("collection")
        .order_by("-created_at")[:12]
    )
    return render(
        request,
        "gallery/dashboard.html",
        {"collections": collections, "assets": assets},
    )


@login_required
def collections_list(request):
    if request.method == "POST":
        form = CollectionForm(request.POST)
        if form.is_valid():
            collection = form.save(commit=False)
            collection.owner = request.user
            collection.save()
            return redirect("collection_detail", collection.id)
    else:
        form = CollectionForm()
    collections = Collection.objects.filter(owner=request.user).order_by("-created_at")
    return render(request, "gallery/collections.html", {"collections": collections, "form": form})


@login_required
def collection_detail(request, collection_id):
    collection = get_object_or_404(Collection, id=collection_id, owner=request.user)
    assets = (
        Asset.objects.filter(collection=collection)
        .select_related("collection")
        .order_by("-created_at")
    )
    if request.method == "POST":
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            asset = form.save(commit=False)
            asset.collection = collection
            asset.save()
            tags_raw = form.cleaned_data.get("tags", "")
            if tags_raw:
                for name in [t.strip() for t in tags_raw.split(",") if t.strip()]:
                    tag, _ = Tag.objects.get_or_create(owner=request.user, name=name)
                    asset.tags.add(tag)
            return redirect("collection_detail", collection_id)
    else:
        form = AssetForm()

    return render(
        request,
        "gallery/collection_detail.html",
        {"collection": collection, "assets": assets, "form": form},
    )


@login_required
def asset_detail(request, asset_id):
    asset = get_object_or_404(Asset, id=asset_id, collection__owner=request.user)
    if request.method == "POST" and "favorite" in request.POST:
        Favorite.objects.get_or_create(user=request.user, asset=asset)
    if request.method == "POST" and "unfavorite" in request.POST:
        Favorite.objects.filter(user=request.user, asset=asset).delete()
    favorite = Favorite.objects.filter(user=request.user, asset=asset).exists()
    return render(request, "gallery/asset_detail.html", {"asset": asset, "favorite": favorite})


@login_required
def search(request):
    form = TagFilterForm(request.GET or None, user=request.user)
    assets = Asset.objects.filter(collection__owner=request.user).select_related("collection")
    if form.is_valid():
        q = form.cleaned_data.get("q")
        tag = form.cleaned_data.get("tag")
        collection = form.cleaned_data.get("collection")
        if q:
            assets = assets.filter(Q(caption__icontains=q))
        if tag:
            assets = assets.filter(tags__name__iexact=tag, tags__owner=request.user)
        if collection:
            assets = assets.filter(collection=collection)
    assets = assets.order_by("-created_at")
    return render(request, "gallery/search.html", {"assets": assets, "form": form})


@login_required
def favorites(request):
    favs = Favorite.objects.filter(user=request.user).select_related("asset", "asset__collection")
    return render(request, "gallery/favorites.html", {"favorites": favs})
