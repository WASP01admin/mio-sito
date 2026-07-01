"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

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

  const trustBadges = t.raw("trustBadges") as string[];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("WASP membership signup:", formData);
  }

  return (
    <section
      id="membership-form"
      className="bg-white px-4 py-10 text-black sm:px-8 sm:py-16"
    >
      <div className="mx-auto max-w-xl">
        <h2 className="text-center text-xl font-bold sm:text-2xl">
          {t("heading")}
        </h2>

        {/* Pricing paths */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 rounded-lg border-2 border-black p-4 text-center">
            <p className="text-2xl font-extrabold">{t("pricing.freeTitle")}</p>
            <p className="mt-1 text-sm text-gray-700">
              {t("pricing.freeDescription")}
            </p>
          </div>
          <div className="flex-1 rounded-lg border-2 border-wasp-yellow bg-black p-4 text-center">
            <p className="text-2xl font-extrabold text-wasp-yellow">
              {t("pricing.paidTitle")}
            </p>
            <p className="mt-1 text-sm text-gray-200">
              {t("pricing.paidDescription")}
            </p>
          </div>
        </div>

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
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
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
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
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
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-image`} className="text-sm font-semibold">
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
                <li>{t("info.organizationNotFound")}</li>
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
          <a
            href="#membership-form"
            className="mt-2 inline-block rounded-md bg-black px-3 py-1.5 text-wasp-yellow"
          >
            {t("cta.link")}
          </a>
        </p>
      </div>
    </section>
  );
}
