"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssociationSearchResult } from "@wasp/shared";
import AssociationPicker from "./AssociationPicker";
import { ToggleBanButton } from "./ChatModerationActions";

export interface MemberRowData {
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
  chatBanned: boolean;
  created_at: string;
  associationLabel: string;
  associationCode: string | null;
}

const DIRECT_ASSOCIATION_CODE = "ITAWASP";
const COLUMN_COUNT = 17;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function daysSince(value: string): number {
  return Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function MemberRow({ member }: { member: MemberRowData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reassociation, setReassociation] = useState<AssociationSearchResult | null>(null);
  const [form, setForm] = useState({
    nickname: member.nickname ?? "",
    first_name: member.first_name ?? "",
    last_name: member.last_name ?? "",
    fiscal_code: member.fiscal_code ?? "",
    email: member.email,
    unique_membership_code: member.unique_membership_code ?? "",
    membershipStatus: member.membership_status,
    isVerified: member.is_verified,
    expiresAt: toDateInputValue(member.expires_at),
    notes_1: member.notes_1 ?? "",
    notes_2: member.notes_2 ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsSubmitting(true);
    await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: form.nickname,
        first_name: form.first_name,
        last_name: form.last_name,
        fiscal_code: form.fiscal_code,
        unique_membership_code: form.unique_membership_code,
        notes_1: form.notes_1,
        notes_2: form.notes_2,
        email: form.email,
        membershipStatus: form.membershipStatus,
        isVerified: form.isVerified,
        expiresAt: form.expiresAt,
        ...(reassociation ? { associationId: reassociation.id } : {}),
      }),
    });
    setIsSubmitting(false);
    setIsEditing(false);
    router.refresh();
  }

  async function act(action: "approve" | "reject") {
    setIsSubmitting(true);
    await fetch(`/api/admin/members/${member.id}/${action}`, { method: "POST" });
    setIsSubmitting(false);
    router.refresh();
  }

  async function togglePayment() {
    setIsSubmitting(true);
    await fetch(`/api/admin/members/${member.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: !member.payment_received_at }),
    });
    setIsSubmitting(false);
    router.refresh();
  }

  const isDirect = member.associationCode === DIRECT_ASSOCIATION_CODE;

  return (
    <>
      <tr className={`border-b border-gray-100 last:border-0 ${isEditing ? "bg-blue-50" : ""}`}>
        <td className="px-3 py-2">{member.nickname ?? "—"}</td>
        <td className="px-3 py-2">{member.first_name ?? "—"}</td>
        <td className="px-3 py-2">{member.last_name ?? "—"}</td>
        <td className="px-3 py-2 font-mono text-xs">{member.fiscal_code ?? "—"}</td>
        <td className="px-3 py-2">{member.email}</td>
        <td className="px-3 py-2">{member.associationLabel}</td>
        <td className="px-3 py-2 font-mono text-xs">{member.unique_membership_code ?? "—"}</td>
        <td className="px-3 py-2">
          <StatusBadge status={member.membership_status} />
        </td>
        <td className="px-3 py-2">{member.is_verified ? "✅" : "—"}</td>
        <td className="px-3 py-2">
          {member.association_contacted_at ? formatDate(member.association_contacted_at) : "—"}
        </td>
        <td className="px-3 py-2">
          {member.association_reply === "yes" && (
            <span className="font-bold text-green-700">YES</span>
          )}
          {member.association_reply === "no" && (
            <span className="font-bold text-red-700">NO</span>
          )}
          {!member.association_reply && "—"}
        </td>
        <td className="px-3 py-2">
          {isDirect ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={togglePayment}
              className={
                member.payment_received_at
                  ? "rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-800 disabled:opacity-50"
                  : "rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-800 disabled:opacity-50"
              }
            >
              {member.payment_received_at
                ? "Paid"
                : `Unpaid (${daysSince(member.created_at)}d)`}
            </button>
          ) : (
            "—"
          )}
        </td>
        <td className="px-3 py-2">{member.expires_at ? formatDate(member.expires_at) : "—"}</td>
        <td className="max-w-[140px] truncate px-3 py-2 text-xs" title={member.notes_1 ?? ""}>
          {member.notes_1 ?? "—"}
        </td>
        <td className="max-w-[140px] truncate px-3 py-2 text-xs" title={member.notes_2 ?? ""}>
          {member.notes_2 ?? "—"}
        </td>
        <td className="px-3 py-2">
          <ToggleBanButton userProfileId={member.id} banned={member.chatBanned} />
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1">
            {member.is_verified && member.membership_status === "pending" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => act("approve")}
                  className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => act("reject")}
                  className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="text-left text-xs text-blue-600 underline"
            >
              {isEditing ? "Close" : "Edit"}
            </button>
          </div>
        </td>
      </tr>

      {isEditing && (
        <tr className="border-b border-gray-200 bg-blue-50">
          <td colSpan={COLUMN_COUNT} className="px-3 py-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Nickname
                <input
                  value={form.nickname}
                  onChange={(e) => update("nickname", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                First name
                <input
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Last name
                <input
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Fiscal code
                <input
                  value={form.fiscal_code}
                  onChange={(e) => update("fiscal_code", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Membership code
                <input
                  value={form.unique_membership_code}
                  onChange={(e) => update("unique_membership_code", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Status
                <select
                  value={form.membershipStatus}
                  onChange={(e) => update("membershipStatus", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Expires
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => update("expiresAt", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>

              <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => update("isVerified", e.target.checked)}
                />
                Email verified
              </label>
              <div className="flex flex-col gap-1 text-xs font-semibold text-gray-600 sm:col-span-2">
                Reassign association (current: {member.associationLabel})
                <AssociationPicker onSelect={setReassociation} />
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 sm:col-span-2">
                Notes 1
                <textarea
                  rows={2}
                  value={form.notes_1}
                  onChange={(e) => update("notes_1", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 sm:col-span-2">
                Notes 2
                <textarea
                  rows={2}
                  value={form.notes_2}
                  onChange={(e) => update("notes_2", e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded bg-gray-300 px-3 py-1.5 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
