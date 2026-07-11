"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function MobileMenu() {
  const t = useTranslations("Header");
  const [isOpen, setIsOpen] = useState(false);

  const navLinks: Array<{ key: string; href: string }> = [
    { key: "home", href: "/" },
    { key: "about", href: "/chi-siamo" },
    { key: "solidarityProject", href: "/solidarity-project" },
    { key: "studies", href: "/studi-e-sondaggi" },
    { key: "organizations", href: "/maps" },
    { key: "calendar", href: "/private-area/calendar" },
    { key: "news", href: "/news" },
    { key: "images", href: "#" },
    { key: "projects", href: "/projects" },
    { key: "animalFriends", href: "/maps/donors" },
    { key: "walletCard", href: "/registrati" },
    { key: "vipWasps", href: "/vip" },
    { key: "privateArea", href: "/private-area" },
    { key: "contact", href: "#" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={isOpen}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className="h-0.5 w-6 bg-wasp-yellow" />
        <span className="h-0.5 w-6 bg-wasp-yellow" />
        <span className="h-0.5 w-6 bg-wasp-yellow" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed right-0 top-0 z-[9999] flex h-full w-full flex-col bg-black p-6 text-white transition-transform duration-300 ease-in-out sm:w-80 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-wasp-yellow">
            {t("wordmark")}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={t("closeMenu")}
            className="text-2xl leading-none text-wasp-yellow"
          >
            &times;
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-4 overflow-y-auto">
          {navLinks.map((link) =>
            link.href === "#" ? (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium tracking-wide hover:text-wasp-yellow"
              >
                {t(`nav.${link.key}`)}
              </a>
            ) : (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium tracking-wide hover:text-wasp-yellow"
              >
                {t(`nav.${link.key}`)}
              </Link>
            )
          )}
        </nav>

        <a
          href="#"
          onClick={() => setIsOpen(false)}
          className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6 text-wasp-yellow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <circle cx="17" cy="15" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-sm font-semibold">{t("walletLink")}</span>
        </a>
      </aside>
    </>
  );
}
