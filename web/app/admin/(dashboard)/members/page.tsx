import { supabaseAdmin } from "@/lib/supabase-admin";
import MemberRow, { type MemberRowData } from "@/components/admin/MemberRow";
import AddVipMemberForm from "@/components/admin/AddVipMemberForm";
import AddMemberForm from "@/components/admin/AddMemberForm";

interface AssociationRef {
  code: string;
  name: string;
  city: string;
}

interface RawMemberRow {
  id: string;
  nickname: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  fiscal_code: string | null;
  notes_1: string | null;
  notes_2: string | null;
  membership_status: string;
  is_verified: boolean;
  association_contacted_at: string | null;
  association_reply: string | null;
  unique_membership_code: string | null;
  expires_at: string | null;
  payment_received_at: string | null;
  created_at: string;
  associations: AssociationRef | AssociationRef[] | null;
}

function toMemberRowData(row: RawMemberRow, bannedIds: Set<string>): MemberRowData {
  const value = row.associations;
  const association = Array.isArray(value) ? (value[0] ?? null) : value;

  return {
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    fiscal_code: row.fiscal_code,
    notes_1: row.notes_1,
    notes_2: row.notes_2,
    membership_status: row.membership_status,
    is_verified: row.is_verified,
    association_contacted_at: row.association_contacted_at,
    association_reply: row.association_reply,
    unique_membership_code: row.unique_membership_code,
    expires_at: row.expires_at,
    payment_received_at: row.payment_received_at,
    chatBanned: bannedIds.has(row.id),
    created_at: row.created_at,
    associationLabel: association ? `${association.name} — ${association.city}` : "—",
    associationCode: association?.code ?? null,
  };
}

export default async function AdminMembersPage() {
  const [{ data, error }, { data: bans, error: bansError }] = await Promise.all([
    supabaseAdmin
      .from("user_profiles")
      .select(
        "id, nickname, email, first_name, last_name, fiscal_code, notes_1, notes_2, membership_status, is_verified, association_contacted_at, association_reply, unique_membership_code, expires_at, payment_received_at, created_at, associations(code, name, city)"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("chat_bans").select("user_profile_id"),
  ]);

  if (error || bansError) {
    return <p className="text-red-600">Failed to load members: {error?.message ?? bansError?.message}</p>;
  }

  const bannedIds = new Set((bans ?? []).map((b) => b.user_profile_id as string));
  const members = ((data ?? []) as RawMemberRow[]).map((row) => toMemberRowData(row, bannedIds));

  return (
    <div>
      <h1 className="text-xl font-bold">Members</h1>
      <p className="mt-1 text-sm text-gray-500">{members.length} total</p>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
          Issue a VIP / honorary card
        </h2>
        <AddVipMemberForm />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase text-gray-500">
          Add a standard member manually
        </h2>
        <AddMemberForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[1600px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Nickname</th>
              <th className="px-3 py-2">First name</th>
              <th className="px-3 py-2">Last name</th>
              <th className="px-3 py-2">Fiscal code</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Association</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Email verified</th>
              <th className="px-3 py-2">Association contacted</th>
              <th className="px-3 py-2">Association reply</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">Notes 1</th>
              <th className="px-3 py-2">Notes 2</th>
              <th className="px-3 py-2">Chat</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
