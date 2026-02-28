from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from markdown import markdown

from .forms import EntryForm, LinkForm, SectionForm
from .models import BlueprintEntry, EntryLink, EntrySection


@login_required
def dashboard(request):
    entries = BlueprintEntry.objects.filter(owner=request.user).order_by("-updated_at")[:8]
    links = EntryLink.objects.filter(from_entry__owner=request.user).select_related("from_entry", "to_entry")[:8]
    return render(request, "library/dashboard.html", {"entries": entries, "links": links})


@login_required
def entries_list(request):
    if request.method == "POST":
        form = EntryForm(request.POST, user=request.user)
        if form.is_valid():
            entry = form.save(commit=False)
            entry.owner = request.user
            entry.save()
            form.save_m2m()
            return redirect("entry_detail", entry.slug)
    else:
        form = EntryForm(user=request.user)
    entries = BlueprintEntry.objects.filter(owner=request.user).order_by("-updated_at")
    return render(request, "library/entries.html", {"entries": entries, "form": form})


@login_required
def entry_detail(request, slug):
    entry = get_object_or_404(BlueprintEntry, owner=request.user, slug=slug)
    sections = entry.sections.all()
    outgoing = entry.outgoing_links.select_related("to_entry")
    incoming = entry.incoming_links.select_related("from_entry")
    body_html = markdown(entry.body)

    if request.method == "POST" and "add_link" in request.POST:
        link_form = LinkForm(request.POST)
        if link_form.is_valid():
            link = link_form.save(commit=False)
            link.from_entry = entry
            link.save()
            return redirect("entry_detail", slug)
    else:
        link_form = LinkForm()
        link_form.fields["to_entry"].queryset = BlueprintEntry.objects.filter(owner=request.user).exclude(id=entry.id)

    if request.method == "POST" and "add_section" in request.POST:
        section_form = SectionForm(request.POST)
        if section_form.is_valid():
            section = section_form.save(commit=False)
            section.entry = entry
            section.save()
            return redirect("entry_detail", slug)
    else:
        section_form = SectionForm()

    return render(
        request,
        "library/entry_detail.html",
        {
            "entry": entry,
            "sections": sections,
            "outgoing": outgoing,
            "incoming": incoming,
            "link_form": link_form,
            "section_form": section_form,
            "body_html": body_html,
        },
    )


@login_required
def search(request):
    q = request.GET.get("q", "")
    tag = request.GET.get("tag", "")
    entries = BlueprintEntry.objects.filter(owner=request.user)
    if q:
        entries = entries.filter(Q(title__icontains=q) | Q(summary__icontains=q) | Q(body__icontains=q))
    if tag:
        entries = entries.filter(tags__name__iexact=tag, tags__owner=request.user)
    entries = entries.order_by("-updated_at")
    return render(request, "library/search.html", {"entries": entries, "q": q, "tag": tag})
