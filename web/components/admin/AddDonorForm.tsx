"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY_CODES, getAllCountryCodes } from "@/lib/country-codes";
import CityAutocomplete from "./CityAutocomplete";
import AddressAutocomplete from "./AddressAutocomplete";
import MapPicker from "./MapPicker";

const EMPTY_FORM = {
  countryCode: "", // NEW: only 3-letter code
  code: "", // AUTO-GENERATED: full code like ITA0001
  name: "",
  city: "",
  country: "",
  address: "",
  postalCode: "",
  lat: "",
  lng: "",
  email: "",
  emailSecondary: "",
  phone: "",
  website: "",
  facebookUrl: "",
  contactPerson: "",
  notes1: "",
  notes2: "",
};

type FormState = typeof EMPTY_FORM;

const FIELDS: { key: keyof FormState; placeholder: string; required?: boolean }[] = [
  { key: "countryCode", placeholder: "Country Code (e.g. ITA, CAN, USA)", required: true },
  { key: "code", placeholder: "Full Code (auto-generated)" },
  { key: "name", placeholder: "Name", required: true },
  { key: "city", placeholder: "City", required: true },
  { key: "country", placeholder: "Country (auto-filled)" },
  { key: "address", placeholder: "Physical address (optional)" },
  { key: "postalCode", placeholder: "Postal code" },
  { key: "lat", placeholder: "Latitude (auto-filled)" },
  { key: "lng", placeholder: "Longitude (auto-filled)" },
  { key: "email", placeholder: "Email" },
  { key: "emailSecondary", placeholder: "Secondary email" },
  { key: "phone", placeholder: "Phone" },
  { key: "website", placeholder: "Website" },
  { key: "facebookUrl", placeholder: "Facebook page" },
  { key: "contactPerson", placeholder: "Reference person" },
  { key: "notes1", placeholder: "Expiration Date (YYYY-MM-DD)" },
  { key: "notes2", placeholder: "Donor Type (standard / special_friend)" },
];

export default function AddDonorForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  async function handleCountryCodeChange(value: string) {
    const sanitized = value.slice(0, 3).toUpperCase();

    // Auto-fill country
    const countryName = COUNTRY_CODES[sanitized as keyof typeof COUNTRY_CODES];

    setForm((prev) => ({
      ...prev,
      countryCode: sanitized,
      country: countryName || prev.country,
    }));

    // Auto-generate full code if valid country code
    if (sanitized.length === 3 && countryName) {
      setCodeLoading(true);
      try {
        const res = await fetch(`/api/admin/next-association-code?countryCode=${sanitized}`);
        const data = await res.json();

        if (data.ok && data.code) {
          setForm((prev) => ({
            ...prev,
            code: data.code,
          }));
        } else {
          setError(data.error || "Failed to generate code");
        }
      } catch (err) {
        setError("Failed to generate code");
      } finally {
        setCodeLoading(false);
      }
    }
  }

  function update(key: keyof FormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (key === "countryCode") {
        handleCountryCodeChange(value);
      } else {
        setForm((prev) => ({ ...prev, [key]: value }));
      }
    };
  }

  async function geocodeAddress() {
    if (!form.city) {
      setError("City is required for geocoding");
      return;
    }

    setGeoLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 3-level geocoding strategy:
      // 1. Street-level (if address provided)
      // 2. City-level (fallback)
      // 3. Manual override (admin can click map)

      let query: string;
      if (form.address && form.address.trim()) {
        query = `${form.address}, ${form.city}, ${form.country}`;
      } else {
        query = `${form.city}, ${form.country}`;
      }

      const countryName = form.countryCode
        ? COUNTRY_CODES[form.countryCode as keyof typeof COUNTRY_CODES] || form.country
        : form.country;

      const params = new URLSearchParams();
      params.append("q", query);
      params.append("city", form.city);
      params.append("country", countryName);

      const res = await fetch(`/api/admin/geocode?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.lat && data.lng) {
        setForm((prev) => ({
          ...prev,
          lat: String(data.lat),
          lng: String(data.lng),
        }));
        setSuccess(`✓ Coordinates found: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`);
      } else {
        setError(
          `Geocoding failed: ${data.error || "location not found"}. Click "Place on map" to set manually.`
        );
      }
    } catch (err) {
      setError("Failed to get coordinates");
      console.error("Geocoding error:", err);
    } finally {
      setGeoLoading(false);
    }
  }

  const handleMapPlace = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng),
    }));
    setSuccess(`✓ Marker placed: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setShowMapPicker(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!form.countryCode || !form.code || !form.name || !form.city) {
      setError("Country Code, Code, Name, and City are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(`Failed to add association: ${data.error ?? "server error"}`);
        console.error("Submit error:", data);
        return;
      }

      setSuccess(`✓ Donor ${form.code} added successfully!`);
      setForm(EMPTY_FORM);
      setTimeout(() => {
        router.refresh();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError("Network error: failed to add association");
      console.error("Submit exception:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4"
    >
      {FIELDS.map(({ key, placeholder, required }) => {
        if (key === "city") {
          // Use country code to get country name for autocomplete (more reliable than form.country)
          const countryName = form.countryCode
            ? COUNTRY_CODES[form.countryCode as keyof typeof COUNTRY_CODES] || form.country
            : form.country;

          return (
            <CityAutocomplete
              key={key}
              value={form.city}
              onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              country={countryName}
              countryCode={form.countryCode}
              placeholder={placeholder}
            />
          );
        }

        if (key === "address") {
          const countryName = form.countryCode
            ? COUNTRY_CODES[form.countryCode as keyof typeof COUNTRY_CODES] || form.country
            : form.country;

          return (
            <AddressAutocomplete
              key={key}
              value={form.address}
              onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
              city={form.city}
              country={countryName}
              placeholder={placeholder}
            />
          );
        }

        const isDisabled = key === "code" || key === "country" || key === "lat" || key === "lng";
        const showLoading = key === "code" && codeLoading;

        return (
          <div key={key} className="relative">
            <input
              required={required}
              placeholder={placeholder}
              value={form[key]}
              onChange={update(key)}
              disabled={isDisabled}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-100"
            />
            {showLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                Generating...
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={geocodeAddress}
        disabled={geoLoading || !form.city}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {geoLoading ? "Getting..." : "Get Coordinates"}
      </button>
      <button
        type="button"
        onClick={() => setShowMapPicker(true)}
        disabled={!form.city}
        className="rounded bg-purple-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Place on map
      </button>
      <button
        type="button"
        onClick={() => {
          setForm(EMPTY_FORM);
          setError(null);
          setSuccess(null);
        }}
        className="rounded bg-gray-400 px-3 py-1.5 text-sm font-bold text-white hover:bg-gray-500"
      >
        Clear
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-3 py-1.5 text-sm font-bold text-wasp-yellow disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add donor"}
      </button>
      {error && (
        <p className="col-span-full text-sm font-semibold text-red-600">
          ✗ {error}
        </p>
      )}
      {success && (
        <p className="col-span-full text-sm font-semibold text-green-600">
          {success}
        </p>
      )}

      {showMapPicker && (
        <MapPicker
          lat={form.lat ? parseFloat(form.lat) : 41.9028}
          lng={form.lng ? parseFloat(form.lng) : 12.4964}
          onPlace={handleMapPlace}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </form>
  );
}
