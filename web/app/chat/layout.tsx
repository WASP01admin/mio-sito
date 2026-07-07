import type { Metadata } from "next";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "WASP Chat",
  robots: { index: false, follow: false },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black text-white">{children}</body>
    </html>
  );
}
