"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY_CODES } from "@/lib/country-codes";
import CityAutocomplete from "@/components/admin/CityAutocomplete";
import AddressAutocomplete from "@/components/admin/AddressAutocomplete";
import MapPicker from "@/components/admin/MapPicker";

const EMPTY_FORM = {
  code: "", // AUTO-GENERATED
  name: "",
  city: "",
  country: "",
  address: "",
  postalCode: "",
  lat: "",
  lng: "",
  email: "",
  phone: "",
  website: "",
};

type FormState = typeof EMPTY_FORM;

const FIELDS: { key: keyof FormState; placeholder: string; required?: boolean }[] = [
  { key: "code", placeholder: "Full Code (auto-generated)" },
  { key: "name", placeholder: "Donor Name", required: true },
  { key: "city", placeholder: "City", required: true },
  { key: "country", placeholder: "Country (auto-filled)" },
  { key: "address", placeholder: "Physical address (optional)" },
  { key: "postalCode", placeholder: "Postal code" },
  { key: "lat", placeholder: "Latitude (auto-filled)" },
  { key: "lng", placeholder: "Longitude (auto-filled)" },
  { key: "email", placeholder: "Email" },
  { key: "phone", placeholder: "Phone" },
  { key: "website", placeholder: "Website" },
];

interface AddDonorFormAssociationProps {
  onDonorAdded?: () => void;
}

export default function AddDonorFormAssociation({ onDonorAdded }: AddDonorFormAssociationProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [countryCode, setCountryCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load association info on mount
  useEffect(() => {
    const loadAssociationInfo = async () => {
      try {
        const res = await fetch("/api/association/me");
        const data = await res.json();

        if (data.ok && data.code) {
          const code = data.code.substring(0, 3); // Extract first 3 letters
          setCountryCode(code);

          const countryName = COUNTRY_CODES[code as keyof typeof COUNTRY_CODES];
          setForm((prev) => ({
            ...prev,
            country: countryName || code,
          }));

          // Auto-generate first code
          generateCode(code);
        }
      } catch (err) {
        setError("Failed to load association info");
        console.error(err);
      }
    };

    loadAssociationInfo();
  }, []);

  async function generateCode(code: string) {
    setCodeLoading(true);
    try {
      const res = await fetch(`/api/association/next-code?countryCode=${code}`);
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

  function update(key: keyof FormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
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
      let query: string;
      if (form.address && form.address.trim()) {
        query = `${form.address}, ${form.city}, ${form.country}`;
      } else {
        query = `${form.city}, ${form.country}`;
      }

      const params = new URLSearchParams();
      params.append("q", query);
      params.append("city", form.city);
      params.append("country", form.country);

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
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!form.code || !form.name || !form.city) {
      setError("Code, Name, and City are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/association/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(`Failed to add donor: ${data.error ?? "server error"}`);
        console.error("Submit error:", data);
        return;
      }

      setSuccess(`✓ Donor ${form.code} added successfully!`);
      setForm(EMPTY_FORM);

      // Reset code
      setTimeout(() => {
        generateCode(countryCode);
        onDonorAdded?.();
      }, 1000);
    } catch (err) {
      setError("Network error: failed to add donor");
      console.error("Submit exception:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Essential fields for simple view
  const essentialFields = ["code", "name", "city", "country"];
  // Advanced fields that can be hidden
  const advancedFields = ["address", "postalCode", "email", "phone", "website", "lat", "lng"];

  const renderField = (key: keyof FormState, placeholder: string, required?: boolean) => {
    if (key === "city") {
      return (
        <CityAutocomplete
          key={key}
          value={form.city}
          onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
          country={form.country}
          countryCode={countryCode}
          placeholder={placeholder}
        />
      );
    }

    if (key === "address") {
      return (
        <AddressAutocomplete
          key={key}
          value={form.address}
          onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
          city={form.city}
          country={form.country}
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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Simple View - Essential Fields Only */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* Row 1: Code, Name, City, Country */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          {/* Code - no number */}
          <div>
            {renderField("code", "Full Code (auto-generated)")}
          </div>

          {/* Name - with ① */}
          <div>
            <label className="text-2xl font-bold text-red-600 mb-1 block leading-none">①</label>
            {renderField("name", "Donor Name", true)}
          </div>

          {/* City - with ② */}
          <div>
            <label className="text-2xl font-bold text-red-600 mb-1 block leading-none">②</label>
            {renderField("city", "City", true)}
          </div>

          {/* Country - no number */}
          <div>
            {renderField("country", "Country (auto-filled)")}
          </div>
        </div>

        {/* Row 2: Action buttons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Place on map - with ③ */}
          <div>
            <label className="text-2xl font-bold text-red-600 mb-1 block leading-none">③</label>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              disabled={!form.city}
              className="w-full rounded bg-purple-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place on map
            </button>
          </div>

          {/* Clear */}
          <div>
            <label className="text-2xl font-bold text-transparent mb-1 block leading-none">—</label>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                generateCode(countryCode);
                setError(null);
                setSuccess(null);
              }}
              className="w-full rounded bg-gray-400 px-3 py-1.5 text-sm font-bold text-white hover:bg-gray-500"
            >
              Clear
            </button>
          </div>

          {/* Add Donor - with ④ */}
          <div>
            <label className="text-2xl font-bold text-red-600 mb-1 block leading-none">④</label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-yellow-500 px-3 py-1.5 text-sm font-bold text-black hover:bg-yellow-600 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Donor"}
            </button>
          </div>
        </div>

        {/* Advanced Features Toggle */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline"
          >
            {showAdvanced ? "▼ hide" : "▶ advanced features"}
          </button>
        </div>

        {/* Advanced Fields - Collapsible */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              {FIELDS.filter(f => advancedFields.includes(f.key as string)).map(({ key, placeholder, required }) =>
                renderField(key as keyof FormState, placeholder, required)
              )}

              <button
                type="button"
                onClick={geocodeAddress}
                disabled={geoLoading || !form.city}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geoLoading ? "Getting..." : "Get Coordinates"}
              </button>
            </div>

            {/* Duplicate action buttons in advanced section */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  generateCode(countryCode);
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
                className="rounded bg-yellow-500 px-3 py-1.5 text-sm font-bold text-black hover:bg-yellow-600 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Donor"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <p className="text-sm font-semibold text-red-600">
          ✗ {error}
        </p>
      )}

      {success && (
        <p className="text-sm font-semibold text-green-600">
          {success}
        </p>
      )}

      {/* Map Picker Modal */}
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
