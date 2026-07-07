"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY_FORM = {
  code: "",
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
  { key: "code", placeholder: "Code (e.g. ITA0124)", required: true },
  { key: "name", placeholder: "Name", required: true },
  { key: "city", placeholder: "City", required: true },
  { key: "country", placeholder: "Country" },
  { key: "address", placeholder: "Physical address" },
  { key: "postalCode", placeholder: "Postal code" },
  { key: "lat", placeholder: "Latitude" },
  { key: "lng", placeholder: "Longitude" },
  { key: "email", placeholder: "Email" },
  { key: "emailSecondary", placeholder: "Secondary email" },
  { key: "phone", placeholder: "Phone" },
  { key: "website", placeholder: "Website" },
  { key: "facebookUrl", placeholder: "Facebook page" },
  { key: "contactPerson", placeholder: "Reference person" },
  { key: "notes1", placeholder: "Notes 1" },
  { key: "notes2", placeholder: "Notes 2" },
];

export default function AddAssociationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof FormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/associations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "server_error");
      return;
    }

    setForm(EMPTY_FORM);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4"
    >
      {FIELDS.map(({ key, placeholder, required }) => (
        <input
          key={key}
          required={required}
          placeholder={placeholder}
          value={form[key]}
          onChange={update(key)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      ))}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-3 py-1.5 text-sm font-bold text-wasp-yellow disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add association"}
      </button>
      {error && (
        <p className="col-span-full text-sm font-semibold text-red-600">
          Error: {error}
        </p>
      )}
    </form>
  );
}
