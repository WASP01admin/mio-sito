import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

export default async function ViewMembersPage() {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, nickname, email, membership_status, is_verified, created_at, associations(code, name)')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="p-4 text-red-600">Error: {error.message}</p>;
  }

  const count = data?.length ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Members (Minimal View)</h1>
      <p className="text-gray-600 mb-6">Total: <strong>{count}</strong></p>

      {count === 0 ? (
        <p className="text-gray-500">No members found</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Nickname</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Verified</th>
                <th className="p-2 text-left">Association</th>
                <th className="p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.nickname}</td>
                  <td className="p-2">{user.membership_status}</td>
                  <td className="p-2">{user.is_verified ? '✓' : '✗'}</td>
                  <td className="p-2">{user.associations?.name || '-'}</td>
                  <td className="p-2 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
