import Image from "next/image";
import { useTranslations } from "next-intl";
import WaspCardGallery from "./WaspCardGallery";
import MembershipForm from "./MembershipForm";

export default function HeroSection() {
  const tHero = useTranslations("Hero");

  return (
    <>
      <section className="flex flex-col items-center gap-1 bg-black px-4 py-8 text-center text-white sm:px-8 sm:py-12">
        <Image
          src="/images/logo-wasp.png"
          alt={tHero("wordmark")}
          width={280}
          height={80}
          priority
          className="h-12 w-auto sm:h-16"
        />
        <p className="text-sm font-medium sm:text-base">{tHero("tagline")}</p>
        <p className="text-xs text-gray-300 sm:text-sm">{tHero("subtitle")}</p>

        <p className="mt-4 max-w-lg text-sm leading-relaxed sm:text-base">
          {tHero("explanation")}
        </p>

        <h1 className="mt-4 text-2xl font-black leading-tight text-wasp-yellow sm:text-4xl">
          {tHero("headline")}
        </h1>
        <p className="text-sm sm:text-base">{tHero("subheadline")}</p>

        <div className="mt-6">
          <WaspCardGallery />
        </div>
      </section>

      <MembershipForm />
    </>
  );
}
