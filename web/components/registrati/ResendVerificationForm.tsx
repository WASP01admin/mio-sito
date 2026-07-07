"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function ResendVerificationForm() {
  const t = useTranslations("RegistrationError.resend");
  const locale = useLocale();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
    } finally {
      setIsSubmitting(false);
      setIsSent(true);
    }
  }

  if (isSent) {
    return (
      <p className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        {t("confirmation")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <h2 className="text-base font-bold">{t("heading")}</h2>
      <label htmlFor={`${formId}-email`} className="sr-only">
        {t("emailPlaceholder")}
      </label>
      <input
        id={`${formId}-email`}
        type="email"
        required
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-black px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-black/80 disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </form>
  );
}
