"use client";

import { useId, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

interface BusinessCardSignupFormProps {
  onClose: () => void;
}

export default function BusinessCardSignupForm({ onClose }: BusinessCardSignupFormProps) {
  const formId = useId();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nickname: "",
    countryCode: "",
    businessName: "",
    partitaIva: "",
    email: "",
    photo: null as File | null,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);

    // Validation
    if (!formData.nickname.trim()) {
      setErrorKey("nickname_required");
      setSubmitState("error");
      return;
    }

    if (formData.countryCode.length !== 3) {
      setErrorKey("invalid_country_code");
      setSubmitState("error");
      return;
    }

    if (!formData.businessName.trim()) {
      setErrorKey("business_name_required");
      setSubmitState("error");
      return;
    }

    if (!formData.partitaIva.trim()) {
      setErrorKey("partita_iva_required");
      setSubmitState("error");
      return;
    }

    if (!formData.email.trim()) {
      setErrorKey("email_required");
      setSubmitState("error");
      return;
    }

    setSubmitState("submitting");

    try {
      const body = new FormData();
      body.set("nickname", formData.nickname.trim());
      body.set("countryCode", formData.countryCode.toUpperCase().trim());
      body.set("businessName", formData.businessName.trim());
      body.set("partitaIva", formData.partitaIva.trim());
      body.set("email", formData.email.trim());
      if (formData.photo) body.set("photo", formData.photo);

      const res = await fetch("/api/business-cards/signup", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorKey(data.error ?? "generic");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    } catch (error) {
      console.error("Signup error:", error);
      setErrorKey("generic");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-green-300 bg-green-50 p-4 text-center">
          <h3 className="font-bold text-green-900">✓ Richiesta Inviata!</h3>
          <p className="mt-2 text-sm text-green-800">
            Controlla la tua email per il link di verifica. Una volta verificato, la tua WASP CARD di Amico degli Animali sarà attiva immediatamente.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80"
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nickname */}
      <div>
        <label htmlFor={`${formId}-nickname`} className="block text-sm font-semibold mb-1">
          Nickname
        </label>
        <input
          id={`${formId}-nickname`}
          type="text"
          required
          maxLength={20}
          placeholder="Il tuo nickname"
          value={formData.nickname}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nickname: e.target.value }))
          }
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
        />
      </div>

      {/* Country Code */}
      <div>
        <label htmlFor={`${formId}-country`} className="block text-sm font-semibold mb-1">
          Country Code (3 lettere)
        </label>
        <input
          id={`${formId}-country`}
          type="text"
          required
          maxLength={3}
          placeholder="es. ITA"
          value={formData.countryCode}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              countryCode: e.target.value.toUpperCase(),
            }))
          }
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none text-center uppercase"
        />
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor={`${formId}-business`} className="block text-sm font-semibold mb-1">
          Nome Attività (come sulla mappa)
        </label>
        <input
          id={`${formId}-business`}
          type="text"
          required
          placeholder="Nome della tua attività"
          value={formData.businessName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, businessName: e.target.value }))
          }
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
        />
      </div>

      {/* Partita Iva */}
      <div>
        <label htmlFor={`${formId}-piva`} className="block text-sm font-semibold mb-1">
          Partita IVA / Business ID
        </label>
        <input
          id={`${formId}-piva`}
          type="text"
          required
          placeholder="es. 12345678901"
          value={formData.partitaIva}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, partitaIva: e.target.value }))
          }
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor={`${formId}-email`} className="block text-sm font-semibold mb-1">
          Email di verifica
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          required
          placeholder="nome@azienda.it"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
        />
      </div>

      {/* Photo */}
      <div>
        <label
          htmlFor={`${formId}-photo`}
          className="flex items-center gap-2 text-sm font-semibold mb-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Foto (opzionale)
        </label>
        <input
          id={`${formId}-photo`}
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              photo: e.target.files?.[0] ?? null,
            }))
          }
          className="text-sm"
        />
        {formData.photo && (
          <p className="mt-1 text-xs text-gray-600">{formData.photo.name}</p>
        )}
      </div>

      {/* Error message */}
      {submitState === "error" && errorKey && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {errorKey === "nickname_required" && "Inserisci un nickname."}
          {errorKey === "invalid_country_code" && "Il codice paese deve essere 3 lettere."}
          {errorKey === "business_name_required" && "Inserisci il nome della tua attività."}
          {errorKey === "partita_iva_required" && "Inserisci la Partita IVA."}
          {errorKey === "email_required" && "Inserisci un'email valida."}
          {errorKey === "email_already_registered" && "Questa email è già registrata."}
          {errorKey === "photo_upload_failed" && "Errore nel caricamento della foto."}
          {errorKey === "generic" && "Qualcosa è andato storto. Riprova."}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitState === "submitting"}
        className="w-full rounded-md bg-black px-4 py-3 font-bold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
      >
        {submitState === "submitting" ? "Invio in corso..." : "INVIA RICHIESTA"}
      </button>
    </form>
  );
}
