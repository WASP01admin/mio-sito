"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function BilancioPage() {
  const t = useTranslations("Bilancio");

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
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
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
            className="rounded-md bg-wasp-yellow px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-wasp-yellow/80"
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
          {/* Transparency Statement */}
          <div className="mb-10 rounded-lg border-4 border-black p-6 text-center italic">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("transparencyStatement")}
            </p>
          </div>

          {/* Download Section */}
          <div className="mb-10 rounded-lg bg-black/5 p-6 text-center">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">
              {t("documentsHeading")}
            </h2>
            <p className="mb-6 text-sm leading-relaxed sm:text-base">
              {t("documentsDescription")}
            </p>
            <a
              href="#bilancio-2026"
              className="inline-block rounded-md bg-black px-6 py-3 text-sm font-bold text-wasp-yellow transition-colors hover:bg-black/80"
            >
              {t("downloadButton")} ↓
            </a>
          </div>

          {/* Explanation */}
          <div className="space-y-4">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("explanation")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
