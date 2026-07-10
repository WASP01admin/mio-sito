"use client";

import { useState, useRef, useEffect } from "react";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  country: string;
  countryCode?: string;
  placeholder?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  country,
  countryCode,
  placeholder = "City",
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    // Skip search if user just selected a suggestion
    if (isSelectingRef.current) {
      return;
    }

    if (!value || !country) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append("q", value);
        if (country) params.append("country", country);
        if (countryCode) params.append("countryCode", countryCode);

        const res = await fetch(`/api/admin/city-suggestions?${params.toString()}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [value, country]);

  const handleSelect = (suggestion: string) => {
    isSelectingRef.current = true;
    onChange(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    // Reset flag after selection to allow typing again
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          Loading...
        </div>
      )}
    </div>
  );
}
