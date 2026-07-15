"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

type PaymentMethodId = "satispay" | "stripe" | "cards" | "bankTransfer";

export default function DonationSection() {
  const t = useTranslations("Donation");
  const groupName = useId();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(
    null
  );

  const paymentMethods: Array<{ id: PaymentMethodId; render: () => React.ReactNode }> = [
    {
      id: "satispay",
      render: () => (
        <div className="flex flex-1 items-center justify-between gap-3">
          <span className="text-base font-bold">{t("methods.satispay.label")}</span>
          <div
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 grid-cols-4 grid-rows-4 gap-0.5 border border-black p-1"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={i % 3 === 0 ? "bg-black" : "bg-transparent"} />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "stripe",
      render: () => (
        <span className="text-base font-bold">{t("methods.stripe.label")}</span>
      ),
    },
    {
      id: "cards",
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          {["PayPal", "Visa", "Mastercard", "Amex"].map((brand) => (
            <span
              key={brand}
              className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold"
            >
              {brand}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "bankTransfer",
      render: () => (
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          >
            <path d="M3 10l9-6 9 6" />
            <path d="M5 10v9M9 10v9M15 10v9M19 10v9" />
            <path d="M3 19h18" />
          </svg>
          <span className="text-base font-bold">
            {t("methods.bankTransfer.label")}
          </span>
        </div>
      ),
    },
  ];

  return (
    <section
      id="donation"
      className="bg-white/90 px-4 py-10 text-black sm:px-8 sm:py-16 scroll-mt-4"
      style={{
        backgroundImage: "url('/images/honeycomb-bg.png')",
        backgroundRepeat: "repeat",
        width: "100%",
      }}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-bold sm:text-2xl">{t("heading")}</h2>
        <p className="text-sm text-gray-600 sm:text-base">{t("subtext")}</p>

        <span className="mt-4 inline-block -rotate-6 border-4 border-double border-black px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
          {t("noCashStamp")}
        </span>

        <p className="mt-6 text-xs font-bold text-red-600 sm:text-sm">
          THE AMOUNT OF THE DONATIONS IS NEVER SHOWN TO THE PUBLIC.
        </p>

        <fieldset className="mt-8 flex w-full flex-col gap-4">
          <legend className="sr-only">{t("heading")}</legend>
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex items-center gap-4 rounded-lg border-2 bg-gray-50 p-4 text-left transition-colors ${
                selectedMethod === method.id
                  ? "border-black"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                className="h-5 w-5 shrink-0 accent-black"
              />
              {method.render()}
            </label>
          ))}
        </fieldset>

        <p className="mt-8 text-xs font-bold text-red-600 sm:text-sm">
          If the donation comes from a company, business, or commercial activity, remember to write (in the donation notes or by email) the NAME and ADDRESS so we can add your company it to the Animal Friends Map.
        </p>

        <p className="mt-6 text-xs text-gray-600 sm:text-sm">{t("note")}</p>
      </div>
    </section>
  );
}
