"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Sponsor {
  name: string;
  website: string;
}

export default function SponsorsPage() {
  const t = useTranslations("Sponsors");

  // In future, this will come from the database/API
  const sponsors: Sponsor[] = [
    // {
    //   name: "Sponsor Name",
    //   website: "https://example.com",
    // },
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
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
          >
            Bilancio
          </Link>
          <Link
            href="/chi-siamo/sponsors"
            className="rounded-md bg-wasp-yellow px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-wasp-yellow/80"
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
          {/* Explanation */}
          <div className="mb-10 space-y-4">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("explanation")}
            </p>
          </div>

          {/* Bank Transfer Section */}
          <div className="mb-10 rounded-lg bg-black/5 p-6">
            <h2 className="mb-4 text-center text-lg font-bold sm:text-xl">
              {t("bankTransferHeading")}
            </h2>

            <div className="mb-6 space-y-3 font-mono text-sm sm:text-base">
              <div>
                <span className="font-bold">Beneficiario:</span> {t("bankDetails.beneficiary")}
              </div>
              <div>
                <span className="font-bold">IBAN:</span> {t("bankDetails.iban")}
              </div>
              <div>
                <span className="font-bold">BANCA:</span> {t("bankDetails.bank")}
              </div>
              <div>
                <span className="font-bold">BIC/SWIFT:</span> {t("bankDetails.swift")}
              </div>
            </div>

            <div className="rounded-lg bg-yellow-100 p-4 text-xs leading-relaxed text-black sm:text-sm">
              <p className="font-bold">⚠️ IMPORTANTE:</p>
              <p>{t("bankDetails.important")}</p>
            </div>
          </div>

          {/* Sponsors List */}
          <div>
            <h2 className="mb-6 text-center text-lg font-bold sm:text-xl">
              {t("sponsorsListHeading")}
            </h2>

            {sponsors.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border-2 border-black">
                <table className="w-full">
                  <thead className="bg-black text-wasp-yellow">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold">
                        {t("table.name")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold">
                        {t("table.website")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map((sponsor, index) => (
                      <tr
                        key={sponsor.name}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 text-sm">{sponsor.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {sponsor.website}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-black/20 bg-black/5 p-6 text-center">
                <p className="text-sm text-gray-600 sm:text-base">
                  {t("noSponsorsYet")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
