"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");

  const socialLinks: Array<{ key: string; abbreviation: string }> = [
    { key: "instagram", abbreviation: "IG" },
    { key: "facebook", abbreviation: "FB" },
    { key: "tiktok", abbreviation: "TT" },
    { key: "youtube", abbreviation: "YT" },
    { key: "telegram", abbreviation: "TG" },
  ];

  const navLinks: Array<{ key: string; href: string }> = [
    { key: "home", href: "/" },
    { key: "about", href: "#" },
    { key: "contact", href: "#" },
    { key: "privateArea", href: "#" },
    { key: "walletCard", href: "#" },
  ];

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="flex flex-col items-center gap-6 bg-black px-4 py-10 text-center text-white sm:px-8">
      <span className="text-xl font-extrabold tracking-wide text-wasp-yellow">
        {t("wordmark")}
      </span>

      <div className="flex items-center gap-3">
        {socialLinks.map((social) => (
          <a
            key={social.key}
            href="#"
            aria-label={t(`social.${social.key}`)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-wasp-yellow text-xs font-semibold text-wasp-yellow"
          >
            {social.abbreviation}
          </a>
        ))}
      </div>

      <hr className="w-full max-w-md border-white/20" />

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        {navLinks.map((link) =>
          link.href === "/" ? (
            <Link key={link.key} href="/" className="hover:text-wasp-yellow">
              {t(`nav.${link.key}`)}
            </Link>
          ) : (
            <a key={link.key} href={link.href} className="hover:text-wasp-yellow">
              {t(`nav.${link.key}`)}
            </a>
          )
        )}
      </nav>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t("backToTop")}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-wasp-yellow text-wasp-yellow"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>

      <p className="text-xs text-gray-400">{t("copyright")}</p>
    </footer>
  );
}
