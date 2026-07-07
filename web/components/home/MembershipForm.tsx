"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AssociationSearchResult } from "@wasp/shared";
import { validateNickname, NICKNAME_MAX_LENGTH } from "@/lib/nickname-validation";

interface MembershipFormData {
  nickname: string;
  email: string;
  image: File | null;
}

const initialFormData: MembershipFormData = {
  nickname: "",
  email: "",
  image: null,
};

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

type SubmitState = "idle" | "submitting" | "success" | "error";
type SuccessStatus = "verify_email_sent" | "association_not_found_email_sent";

interface MembershipFormProps {
  isMobile: boolean;
}

export default function MembershipForm({ isMobile }: MembershipFormProps) {
  const t = useTranslations("MembershipForm");
  const locale = useLocale();
  const formId = useId();
  const [formData, setFormData] = useState<MembershipFormData>(initialFormData);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOrgSuggestOpen, setIsOrgSuggestOpen] = useState(false);
  const [orgSuggestion, setOrgSuggestion] = useState("");

  const [orgQuery, setOrgQuery] = useState("");
  const [selectedAssociation, setSelectedAssociation] =
    useState<AssociationSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<AssociationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [successStatus, setSuccessStatus] = useState<SuccessStatus | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trustBadges = t.raw("trustBadges") as string[];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selectedAssociation || orgQuery.trim().length < MIN_QUERY_LENGTH) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/associations?q=${encodeURIComponent(orgQuery.trim())}`
        );
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
        setShowDropdown(true);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [orgQuery, selectedAssociation]);

  function handleOrgInputChange(value: string) {
    setOrgQuery(value);
    setSelectedAssociation(null);

    const meetsMinLength = value.trim().length >= MIN_QUERY_LENGTH;
    setIsSearching(meetsMinLength);
    if (!meetsMinLength) {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }

  function handleSelectSuggestion(assoc: AssociationSearchResult) {
    setSelectedAssociation(assoc);
    setOrgQuery(`${assoc.name} — ${assoc.city}`);
    setSuggestions([]);
    setShowDropdown(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);

    const nicknameResult = validateNickname(formData.nickname);
    if (!nicknameResult.valid) {
      setErrorKey(`nickname_${nicknameResult.error}`);
      setSubmitState("error");
      return;
    }

    setSubmitState("submitting");

    const body = new FormData();
    body.set("nickname", nicknameResult.value);
    body.set("email", formData.email);
    body.set("locale", locale);
    if (selectedAssociation) {
      body.set("associationId", selectedAssociation.id);
    } else {
      body.set("associationQuery", orgQuery.trim());
    }
    if (formData.image) body.set("photo", formData.image);

    try {
      const res = await fetch("/api/register", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorKey(data.error ?? "generic");
        setSubmitState("error");
        return;
      }
      setSuccessStatus(data.status as SuccessStatus);
      setSubmitState("success");
    } catch {
      setErrorKey("generic");
      setSubmitState("error");
    }
  }

  async function handleOrgSuggestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await fetch("/api/associations/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: orgSuggestion }),
      });
    } finally {
      setOrgSuggestion("");
      setIsOrgSuggestOpen(false);
    }
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

        {!isMobile && (
          <p className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-center text-sm font-semibold text-yellow-900">
            {t("mobileWarning")}
          </p>
        )}

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

        {submitState === "success" ? (
          <div className="mt-8 rounded-md border border-green-300 bg-green-50 p-4 text-center text-sm font-semibold text-green-900">
            {successStatus === "verify_email_sent"
              ? t("success.verifyEmailSent")
              : t("success.associationNotFoundEmailSent")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${formId}-nickname`} className="text-sm font-semibold">
                {t("fields.nickname.label")}
              </label>
              <input
                id={`${formId}-nickname`}
                type="text"
                required
                maxLength={NICKNAME_MAX_LENGTH}
                placeholder={t("fields.nickname.placeholder")}
                value={formData.nickname}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nickname: e.target.value }))
                }
                className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
              />
            </div>

            <div className="relative flex flex-col gap-1">
              <label
                htmlFor={`${formId}-organization`}
                className="text-sm font-semibold"
              >
                {t("fields.organization.label")}
              </label>
              <input
                id={`${formId}-organization`}
                type="text"
                required
                autoComplete="off"
                placeholder={t("fields.organization.placeholder")}
                value={orgQuery}
                onChange={(e) => handleOrgInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
              />

              {selectedAssociation && (
                <p className="text-xs text-gray-600">
                  {t("fields.organization.selectedPrefix")}{" "}
                  <strong>
                    {selectedAssociation.name} — {selectedAssociation.city}
                  </strong>{" "}
                  ({selectedAssociation.code})
                </p>
              )}

              {showDropdown && !selectedAssociation && (
                <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                  {isSearching ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      {t("fields.organization.searching")}
                    </p>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((assoc) => (
                        <li key={assoc.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSuggestion(assoc)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            {assoc.name} — {assoc.city}{" "}
                            <span className="text-gray-400">({assoc.code})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      {t("fields.organization.noMatches")}
                    </p>
                  )}
                </div>
              )}
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

            {submitState === "error" && errorKey && (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                {t(`errors.${errorKey}`)}
              </p>
            )}

            <button
              type="submit"
              disabled={submitState === "submitting"}
              className="mt-2 rounded-md bg-black px-4 py-3 text-base font-bold text-wasp-yellow transition-colors hover:bg-black/80 disabled:opacity-50"
            >
              {submitState === "submitting" ? t("submitting") : t("submit")}
            </button>
          </form>
        )}

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
