import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const t = useTranslations("Header");

  return (
    <header className="flex items-center justify-between bg-black px-4 py-2 sm:px-8">
      <Link
        href="/"
        className="text-lg font-extrabold tracking-wide text-wasp-yellow sm:text-xl"
      >
        {t("wordmark")}
      </Link>
      <MobileMenu />
    </header>
  );
}
