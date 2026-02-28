import { useMemo, useState } from "preact/hooks";

type Props = {
  initialQuery: Record<string, string>;
  total: number;
};

const tags = ["signal", "archive", "atlas", "index", "field", "relay", "grid"];

export default function FiltersIsland({ initialQuery, total }: Props) {
  const [search, setSearch] = useState(initialQuery.search ?? "");
  const [tag, setTag] = useState(initialQuery.tag ?? "");
  const [sort, setSort] = useState(initialQuery.sort ?? "newest");
  const [saving, setSaving] = useState(false);
  const [viewName, setViewName] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);
    return params.toString();
  }, [search, tag, sort]);

  const applyFilters = () => {
    const url = queryString ? `/?${queryString}` : "/";
    window.location.assign(url);
  };

  const saveView = async () => {
    if (!viewName.trim()) return;
    setSaving(true);
    await fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: viewName.trim(),
        state: { search, tag, sort },
      }),
    });
    setViewName("");
    setSaving(false);
  };

  return (
    <section class="panel">
      <div class="filters">
        <input
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder="Search items"
        />
        <select value={tag} onChange={(e) => setTag((e.target as HTMLSelectElement).value)}>
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value)}>
          <option value="newest">Newest</option>
          <option value="score">Highest score</option>
        </select>
        <button class="button" onClick={applyFilters}>
          Apply
        </button>
        <span class="pill">{total} results</span>
      </div>
      <div class="save-row">
        <input
          value={viewName}
          onInput={(e) => setViewName((e.target as HTMLInputElement).value)}
          placeholder="Save this view"
        />
        <button class="button ghost" onClick={saveView} disabled={saving}>
          {saving ? "Saving..." : "Save View"}
        </button>
        <a class="button ghost" href="/views">
          View Library
        </a>
      </div>
    </section>
  );
}
