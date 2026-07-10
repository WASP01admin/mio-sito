"use client";

import { useState, useRef, useEffect } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  city: string;
  country: string;
  placeholder?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  city,
  country,
  placeholder = "Street address",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!value || !city || !country) {
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
        params.append("city", city);
        params.append("country", country);

        const res = await fetch(`/api/admin/address-suggestions?${params.toString()}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [value, city, country]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSuggestions([]);
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
