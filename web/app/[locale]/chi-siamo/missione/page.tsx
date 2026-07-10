"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ObjectiveItem {
  title: string;
  description: string;
}

export default function MissionePage() {
  const t = useTranslations("Missione");
  const [expandedObjective, setExpandedObjective] = useState<number | null>(null);

  const objectives: ObjectiveItem[] = [
    {
      title: t("objectives.1.title"),
      description: t("objectives.1.description"),
    },
    {
      title: t("objectives.2.title"),
      description: t("objectives.2.description"),
    },
    {
      title: t("objectives.3.title"),
      description: t("objectives.3.description"),
    },
    {
      title: t("objectives.4.title"),
      description: t("objectives.4.description"),
    },
    {
      title: t("objectives.5.title"),
      description: t("objectives.5.description"),
    },
    {
      title: t("objectives.6.title"),
      description: t("objectives.6.description"),
    },
    {
      title: t("objectives.7.title"),
      description: t("objectives.7.description"),
    },
    {
      title: t("objectives.8.title"),
      description: t("objectives.8.description"),
    },
    {
      title: t("objectives.9.title"),
      description: t("objectives.9.description"),
    },
    {
      title: t("objectives.10.title"),
      description: t("objectives.10.description"),
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
            className="rounded-md border-2 border-wasp-yellow px-4 py-2 text-sm font-bold text-wasp-yellow transition-colors hover:bg-wasp-yellow/20"
          >
            Chi Siamo
          </Link>
          <Link
            href="/chi-siamo/missione"
            className="rounded-md bg-wasp-yellow px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-wasp-yellow/80"
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
          {/* Mission Statement */}
          <div className="mb-10 rounded-lg border-4 border-black p-6 italic text-center">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("missionStatement")}
            </p>
          </div>

          {/* Philosophy */}
          <div className="mb-10 space-y-4">
            <p className="text-sm leading-relaxed sm:text-base">
              {t("philosophy.paragraph1")}
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              {t("philosophy.paragraph2")}
            </p>
          </div>

          {/* Objectives Section */}
          <div className="space-y-3">
            <h2 className="mb-6 text-center text-lg font-bold sm:text-xl">
              {t("objectivesHeading")}
            </h2>
            {objectives.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-black/20 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedObjective(expandedObjective === index ? null : index)
                  }
                  className="w-full bg-black/5 px-4 py-3 text-left transition-colors hover:bg-black/10 flex items-center justify-between"
                >
                  <span className="text-sm font-bold sm:text-base">
                    {index + 1}. {item.title}
                  </span>
                  <span className="text-lg">
                    {expandedObjective === index ? "−" : "+"}
                  </span>
                </button>
                {expandedObjective === index && (
                  <div className="bg-white/50 px-4 py-3 text-sm leading-relaxed sm:text-base">
                    {item.description}
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
