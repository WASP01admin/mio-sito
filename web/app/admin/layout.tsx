import type { Metadata } from "next";
import "../../styles/globals.css";
import AdminNav from "@/components/admin/AdminNav";

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
      <body className="min-h-full bg-gray-900 text-white">
        <AdminNav />
        {children}
      </body>
    </html>
  );
}
