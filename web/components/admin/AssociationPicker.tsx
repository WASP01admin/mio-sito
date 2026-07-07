"use client";

import { useEffect, useRef, useState } from "react";
import type { AssociationSearchResult } from "@wasp/shared";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

interface AssociationPickerProps {
  initialLabel?: string;
  onSelect: (association: AssociationSearchResult | null) => void;
  className?: string;
}

export default function AssociationPicker({
  initialLabel,
  onSelect,
  className,
}: AssociationPickerProps) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [selected, setSelected] = useState<AssociationSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<AssociationSearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selected || query.trim().length < MIN_QUERY_LENGTH) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/associations?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    onSelect(null);
  }

  function handleSelect(assoc: AssociationSearchResult) {
    setSelected(assoc);
    setQuery(`${assoc.name} — ${assoc.city}`);
    setSuggestions([]);
    onSelect(assoc);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        type="text"
        placeholder="Search association..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      {!selected && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow">
          {suggestions.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => handleSelect(a)}
                className="block w-full px-2 py-1 text-left text-xs hover:bg-gray-100"
              >
                {a.name} — {a.city} ({a.code})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
