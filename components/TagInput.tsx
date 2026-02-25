"use client";

import { useState } from "react";

export default function TagInput({
  tags,
  onChange,
  suggestions = []
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [value, setValue] = useState("");

  const addTag = (raw: string) => {
    const cleaned = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleaned) return;
    if (tags.includes(cleaned)) return;
    onChange([...tags, cleaned].slice(0, 12));
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((item) => item !== tag));
  };

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(value);
      setValue("");
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-input__chips">
        {tags.map((tag) => (
          <button key={tag} type="button" className="pill" onClick={() => removeTag(tag)}>
            {tag} ×
          </button>
        ))}
        <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKey} placeholder="Add tags" />
      </div>
      {suggestions.length ? (
        <div className="row">
          {suggestions.map((tag) => (
            <button key={tag} type="button" className="secondary" onClick={() => addTag(tag)}>
              + {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
