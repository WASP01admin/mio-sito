import { useTranslations } from "next-intl";
import MobileMenu from "./MobileMenu";
import MembershipForm from "./MembershipForm";

export default function HeroSection() {
  const tHeader = useTranslations("Header");
  const tHero = useTranslations("Hero");

  return (
    <>
      <header className="flex items-center justify-between bg-black px-4 py-4 sm:px-8">
        <span className="text-lg font-extrabold tracking-wide text-wasp-yellow sm:text-xl">
          {tHeader("wordmark")}
        </span>
        <MobileMenu />
      </header>

      <section className="flex flex-col items-center gap-4 bg-black px-4 py-10 text-center text-white sm:px-8 sm:py-16">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-wasp-yellow text-xs font-semibold text-wasp-yellow sm:h-24 sm:w-24"
        >
          LOGO
        </div>

        <p className="text-2xl font-extrabold text-wasp-yellow sm:text-3xl">
          {tHero("wordmark")}
        </p>
        <p className="text-sm font-medium sm:text-base">{tHero("tagline")}</p>
        <p className="text-xs text-gray-300 sm:text-sm">{tHero("subtitle")}</p>

        <span className="mt-2 rounded-full bg-wasp-yellow px-3 py-1 text-xs font-bold text-black">
          {tHero("badge")}
        </span>

        <h1 className="mt-4 text-2xl font-black leading-tight text-wasp-yellow sm:text-4xl">
          {tHero("headline")}
        </h1>
        <p className="text-sm sm:text-base">{tHero("subheadline")}</p>
      </section>

      <MembershipForm />
    </>
  );
}
