"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { validateNickname, NICKNAME_MAX_LENGTH } from "@/lib/nickname-validation";

interface FormData {
  nickname: string;
  email: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  photo: File | null;
}

const initialFormData: FormData = {
  nickname: "",
  email: "",
  firstName: "",
  lastName: "",
  fiscalCode: "",
  photo: null,
};

type SubmitState = "idle" | "submitting" | "success" | "error";
type SuccessStatus = "verify_email_sent";

interface DirectMembershipFormProps {
  isMobile: boolean;
}

export default function DirectMembershipForm({ isMobile }: DirectMembershipFormProps) {
  const t = useTranslations("DirectMembershipForm");
  const locale = useLocale();
  const formId = useId();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [successStatus, setSuccessStatus] = useState<SuccessStatus | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    body.set("firstName", formData.firstName);
    body.set("lastName", formData.lastName);
    body.set("fiscalCode", formData.fiscalCode);
    body.set("locale", locale);
    if (formData.photo) body.set("photo", formData.photo);

    try {
      const res = await fetch("/api/register-direct", { method: "POST", body });
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

  if (submitState === "success") {
    return (
      <div className="mt-8 rounded-md border border-green-300 bg-green-50 p-4 text-center text-sm font-semibold text-green-900">
        {successStatus === "verify_email_sent" && t("success.verifyEmailSent")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {!isMobile && (
        <p className="mb-6 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-center text-sm font-semibold text-yellow-900">
          {t("mobileWarning")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            onChange={(e) => set("nickname", e.target.value)}
            className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-firstName`} className="text-sm font-semibold">
              {t("fields.firstName.label")}
            </label>
            <input
              id={`${formId}-firstName`}
              type="text"
              required
              placeholder={t("fields.firstName.placeholder")}
              value={formData.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-lastName`} className="text-sm font-semibold">
              {t("fields.lastName.label")}
            </label>
            <input
              id={`${formId}-lastName`}
              type="text"
              required
              placeholder={t("fields.lastName.placeholder")}
              value={formData.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-fiscalCode`} className="text-sm font-semibold">
            {t("fields.fiscalCode.label")}{" "}
            <span className="font-normal text-gray-500">
              ({t("fields.fiscalCode.hint")})
            </span>
          </label>
          <input
            id={`${formId}-fiscalCode`}
            type="text"
            required
            placeholder={t("fields.fiscalCode.placeholder")}
            value={formData.fiscalCode}
            onChange={(e) => set("fiscalCode", e.target.value)}
            className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-email`} className="text-sm font-semibold">
            {t("fields.email.label")}{" "}
            <span className="font-normal text-gray-500">({t("fields.email.hint")})</span>
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            required
            placeholder={t("fields.email.placeholder")}
            value={formData.email}
            onChange={(e) => set("email", e.target.value)}
            className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
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
            onChange={(e) => set("photo", e.target.files?.[0] ?? null)}
            className="text-sm"
          />
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
    </div>
  );
}
