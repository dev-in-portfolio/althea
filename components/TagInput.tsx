"use client";

import { useState } from "react";
import { normalizeTag } from "../lib/tags";

export default function TagInput({
  tags,
  onChange,
  placeholder
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  const addTag = (raw: string) => {
    const cleaned = normalizeTag(raw);
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
          <button
            key={tag}
            type="button"
            className="tag"
            onClick={() => removeTag(tag)}
            title="Remove tag"
          >
            {tag} ×
          </button>
        ))}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Add tags"}
        />
      </div>
      <small>Press Enter or comma to add a tag.</small>
    </div>
  );
}
