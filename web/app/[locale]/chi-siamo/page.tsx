"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface FAQItem {
  question: string;
  answer: string;
}

export default function ChiSiamoPage() {
  const t = useTranslations("ChiSiamo");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: t("faq.1.question"),
      answer: t("faq.1.answer"),
    },
    {
      question: t("faq.2.question"),
      answer: t("faq.2.answer"),
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <h1 className="text-3xl font-black text-wasp-yellow sm:text-4xl">
          {t("title")}
        </h1>

        {/* Navigation Links */}
        <nav className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/chi-siamo"
            className="rounded-md bg-wasp-yellow px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-wasp-yellow/80"
          >
            Chi Siamo
          </Link>
          <Link
            href="/chi-siamo/missione"
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
          >
            Missione
          </Link>
          <Link
            href="/chi-siamo/bilancio"
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
          >
            Bilancio
          </Link>
          <Link
            href="/chi-siamo/sponsors"
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
          >
            Sponsors
          </Link>
        </nav>
      </section>

      {/* Main Content */}
      <section
        className="relative px-4 py-10 text-black sm:px-8 sm:py-16"
        style={{
          backgroundImage: "url('/images/honeycomb-bg.png')",
          backgroundRepeat: "repeat",
          width: "100%",
        }}
      >
        <div className="mx-auto max-w-2xl">
          {/* Introduction */}
          <div className="mb-10 space-y-4 text-center">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("intro.paragraph1")}
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              {t("intro.paragraph2")}
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              {t("intro.paragraph3")}
            </p>
          </div>

          {/* Documents Section */}
          <div className="mb-10 rounded-lg bg-black/5 p-6 text-center">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">
              {t("documents.heading")}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
              <a
                href="#atto-costitutivo"
                className="rounded-md bg-black px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-black/80"
              >
                {t("documents.attoCostitutivo")} ↓
              </a>
              <a
                href="#statuto"
                className="rounded-md bg-black px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-black/80"
              >
                {t("documents.statuto")} ↓
              </a>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-3">
            <h2 className="mb-6 text-center text-lg font-bold sm:text-xl">
              {t("faq.heading")}
            </h2>
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-black/20 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === index ? null : index)
                  }
                  className="w-full bg-black/5 px-4 py-3 text-left font-bold text-black transition-colors hover:bg-black/10 flex items-center justify-between"
                >
                  <span className="text-sm sm:text-base">{item.question}</span>
                  <span className="text-lg">
                    {expandedFAQ === index ? "−" : "+"}
                  </span>
                </button>
                {expandedFAQ === index && (
                  <div className="bg-white/50 px-4 py-3 text-sm leading-relaxed sm:text-base">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
