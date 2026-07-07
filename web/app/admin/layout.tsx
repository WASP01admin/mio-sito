import type { Metadata } from "next";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "WASP Admin",
  description: "WASP Card administration",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-black">{children}</body>
    </html>
  );
}
