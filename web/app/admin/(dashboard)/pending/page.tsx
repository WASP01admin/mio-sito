import { supabaseAdmin } from "@/lib/supabase-admin";
import ResolvePendingForm from "@/components/admin/ResolvePendingForm";

interface PendingRow {
  id: string;
  email: string;
  nickname: string | null;
  submitted_association_string: string;
  created_at: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPendingPage() {
  const { data, error } = await supabaseAdmin
    .from("pending_submissions")
    .select("id, email, nickname, submitted_association_string, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="text-red-600">Failed to load pending submissions: {error.message}</p>
    );
  }

  const submissions = (data ?? []) as PendingRow[];

  return (
    <div>
      <h1 className="text-xl font-bold">Pending Submissions</h1>
      <p className="mt-1 text-sm text-gray-500">
        {submissions.length} awaiting resolution
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Nickname</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Typed association</th>
              <th className="px-3 py-2">Resolve</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2">{formatDate(s.created_at)}</td>
                <td className="px-3 py-2">{s.nickname ?? "—"}</td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2">{s.submitted_association_string}</td>
                <td className="px-3 py-2">
                  <ResolvePendingForm submissionId={s.id} />
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Nothing pending 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
