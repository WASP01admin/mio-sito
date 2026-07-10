import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function AboutSection() {
  const t = useTranslations("About");
  const studyItems = t.raw("studies.items") as string[];
  const ruleItems = t.raw("rules.items") as string[];

  return (
    <section
      className="bg-white/90 px-4 py-10 text-black sm:px-8 sm:py-16"
      style={{
        backgroundImage: "url('/images/honeycomb-bg.png')",
        backgroundRepeat: "repeat",
        width: "100%",
      }}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-sm leading-relaxed sm:text-base">
          {t("mission.paragraph1")}
        </p>
        <p className="text-sm leading-relaxed sm:text-base">
          {t("mission.paragraph2")}
        </p>
        <p className="text-sm font-semibold leading-relaxed sm:text-base">
          {t("mission.paragraph3")}
        </p>

        <Image
          src="/images/mascot-wasp.png"
          alt="WASP mascot"
          width={320}
          height={213}
          className="mt-4 h-auto w-64 rounded-lg sm:w-80"
        />

        <Link
          href="/registrati"
          className="mt-2 rounded-md bg-black px-5 py-3 text-base font-bold text-wasp-yellow transition-colors hover:bg-black/80"
        >
          {t("cta")}
        </Link>

        <div className="mt-10 flex flex-col gap-4">
          <p className="text-sm leading-relaxed sm:text-base">
            {t("businessPitch.paragraph1")}
          </p>
          <p className="text-sm leading-relaxed sm:text-base">
            {t("businessPitch.paragraph2")}
          </p>
        </div>

        <h2 className="mt-10 text-lg font-bold sm:text-xl">
          {t.rich("studies.heading", {
            link: (chunks) => (
              <Link href="/studi-e-sondaggi" className="underline decoration-2 underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </h2>

        <ul className="mt-2 flex flex-col gap-6 sm:flex-row sm:gap-4">
          {studyItems.map((item, index) => (
            <li
              key={item}
              className="flex flex-1 flex-col items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-wasp-yellow"
              >
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed sm:text-base">{item}</p>
            </li>
          ))}
        </ul>

        <a
          href="#donation"
          className="mt-10 block rounded-lg bg-wasp-yellow px-4 py-4 text-sm font-extrabold uppercase leading-relaxed text-black transition-colors hover:bg-wasp-yellow/80 sm:text-base"
        >
          {t("callout")}
        </a>

        <div className="mt-10 flex flex-col gap-4">
          <p className="text-sm leading-relaxed sm:text-base">
            {t("friendsExplanation.paragraph1")}
          </p>
          <p className="text-sm italic leading-relaxed text-gray-600 sm:text-base">
            {t("friendsExplanation.ps")}
          </p>
          <p className="text-sm font-semibold leading-relaxed sm:text-base">
            {t("friendsExplanation.movement")}
          </p>
        </div>

        <div className="mt-10 w-full rounded-lg border-4 border-black p-4 text-left sm:p-6">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            {t("rules.heading")}
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {ruleItems.map((item, index) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-wasp-yellow"
                >
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed sm:text-base">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
