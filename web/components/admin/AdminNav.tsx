"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

const LINKS = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/pending", label: "Pending Submissions" },
  { href: "/admin/associations", label: "Associations" },
  { href: "/admin/donors", label: "Donors" },
  { href: "/admin/chat", label: "Chat" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-black px-4 py-3 sm:px-8">
      <div className="flex items-center gap-6">
        <span className="font-bold text-wasp-yellow">WASP Admin</span>
        <Link
          href="/admin"
          className={`flex items-center gap-2 text-sm transition-colors ${
            pathname === "/admin"
              ? "font-bold text-wasp-yellow"
              : "text-gray-300 hover:text-white"
          }`}
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <ul className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  pathname?.startsWith(link.href)
                    ? "font-bold text-wasp-yellow"
                    : "text-gray-300 hover:text-white"
                }
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-gray-300 hover:text-white"
      >
        Sign out
      </button>
    </nav>
  );
}
