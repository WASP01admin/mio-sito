import AdminNav from "@/components/admin/AdminNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
    </>
  );
}
