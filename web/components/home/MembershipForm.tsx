"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface MembershipFormData {
  nickname: string;
  organization: string;
  email: string;
  image: File | null;
}

const initialFormData: MembershipFormData = {
  nickname: "",
  organization: "",
  email: "",
  image: null,
};

export default function MembershipForm() {
  const t = useTranslations("MembershipForm");
  const formId = useId();
  const [formData, setFormData] = useState<MembershipFormData>(initialFormData);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOrgSuggestOpen, setIsOrgSuggestOpen] = useState(false);
  const [orgSuggestion, setOrgSuggestion] = useState("");

  const trustBadges = t.raw("trustBadges") as string[];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("WASP membership signup:", formData);
  }

  function handleOrgSuggestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("WASP missing organization suggestion:", orgSuggestion);
    setOrgSuggestion("");
    setIsOrgSuggestOpen(false);
  }

  return (
    <section
      id="membership-form"
      className="bg-white/90 px-4 py-10 text-black sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-xl">
        <h2 className="text-center text-xl font-bold sm:text-2xl">
          {t("heading")}
        </h2>

        {/* Pricing */}
        <div className="mt-6 rounded-xl border-2 border-wasp-yellow bg-black px-5 py-6 text-center">
          <p className="text-3xl font-black text-wasp-yellow sm:text-4xl">
            {t("pricing.freeTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-200 sm:text-base">
            {t("pricing.freeDescription")}
          </p>
        </div>

        <p className="mt-4 text-center text-sm leading-relaxed text-gray-700 sm:text-base">
          {t.rich("noOrgCta", {
            link: (chunks) => (
              <Link
                href="/registrati"
                className="font-bold text-black underline decoration-2 underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        {/* Trust badges */}
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {trustBadges.map((badge) => (
            <li
              key={badge}
              className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-wasp-yellow"
            >
              {badge}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-gray-700">
          {t("explanation")}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-nickname`} className="text-sm font-semibold">
              {t("fields.nickname.label")}
            </label>
            <input
              id={`${formId}-nickname`}
              type="text"
              required
              placeholder={t("fields.nickname.placeholder")}
              value={formData.nickname}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nickname: e.target.value }))
              }
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-organization`}
              className="text-sm font-semibold"
            >
              {t("fields.organization.label")}
            </label>
            <input
              id={`${formId}-organization`}
              type="text"
              placeholder={t("fields.organization.placeholder")}
              value={formData.organization}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organization: e.target.value,
                }))
              }
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-email`} className="text-sm font-semibold">
              {t("fields.email.label")}{" "}
              <span className="font-normal text-gray-500">
                ({t("fields.email.hint")})
              </span>
            </label>
            <input
              id={`${formId}-email`}
              type="email"
              required
              placeholder={t("fields.email.placeholder")}
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-image`}
              className="flex items-center gap-2 text-sm font-semibold"
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
              {t("fields.image.label")}
            </label>
            <input
              id={`${formId}-image`}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  image: e.target.files?.[0] ?? null,
                }))
              }
              className="text-sm"
            />
          </div>

          {/* Info toggle */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <button
              type="button"
              onClick={() => setIsInfoOpen((prev) => !prev)}
              aria-expanded={isInfoOpen}
              className="flex w-full items-center gap-2 text-left text-sm font-semibold"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black text-xs">
                i
              </span>
              {t("info.toggleLabel")}
            </button>
            {isInfoOpen && (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-gray-700">
                <li>{t("info.nicknameRules")}</li>
                <li>
                  {t.rich("info.organizationNotFound", {
                    link: (chunks) => (
                      <button
                        type="button"
                        onClick={() => setIsOrgSuggestOpen(true)}
                        className="text-blue-600 underline"
                      >
                        {chunks}
                      </button>
                    ),
                  })}
                </li>
                <li>{t("info.emailMatching")}</li>
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-black px-4 py-3 text-base font-bold text-wasp-yellow transition-colors hover:bg-black/80"
          >
            {t("submit")}
          </button>
        </form>

        {/* QR code placeholder */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="grid h-36 w-36 grid-cols-5 grid-rows-5 gap-1 border-2 border-black p-2"
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <span
                key={i}
                className={i % 3 === 0 ? "bg-black" : "bg-transparent"}
              />
            ))}
          </div>
          <p className="max-w-xs text-center text-xs text-gray-600">
            {t("qrCode.caption")}
          </p>
        </div>

        {/* CTA */}
        <p className="mt-10 text-center text-sm font-semibold uppercase leading-relaxed">
          {t("cta.text")}{" "}
          <Link
            href="/registrati"
            className="mt-2 inline-block rounded-md bg-black px-3 py-1.5 text-wasp-yellow"
          >
            {t("cta.link")}
          </Link>
        </p>
      </div>

      {isOrgSuggestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsOrgSuggestOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">
                {t("orgSuggestModal.title")}
              </h3>
              <button
                type="button"
                onClick={() => setIsOrgSuggestOpen(false)}
                aria-label={t("orgSuggestModal.closeLabel")}
                className="text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleOrgSuggestSubmit} className="mt-4 flex flex-col gap-3">
              <textarea
                required
                rows={3}
                placeholder={t("orgSuggestModal.placeholder")}
                value={orgSuggestion}
                onChange={(e) => setOrgSuggestion(e.target.value)}
                className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-black/80"
              >
                {t("orgSuggestModal.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
