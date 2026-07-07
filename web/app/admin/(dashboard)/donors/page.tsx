import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AddDonorForm from "@/components/admin/AddDonorForm";

interface DonorRow {
  id: string;
  code: string | null;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
  email_secondary: string | null;
  phone: string | null;
  website: string | null;
  facebook_url: string | null;
  contact_person: string | null;
}

interface DonorsPageProps {
  searchParams: Promise<{ sort?: string }>;
}

const SORT_OPTIONS = {
  name: { column: "name", label: "Name" },
  country: { column: "country", label: "Country" },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string | undefined): value is SortKey {
  return value === "name" || value === "country";
}

export default async function AdminDonorsPage({ searchParams }: DonorsPageProps) {
  const { sort } = await searchParams;
  const sortKey: SortKey = isSortKey(sort) ? sort : "name";

  const { data, error } = await supabaseAdmin
    .from("donors")
    .select(
      "id, code, name, city, country, address, lat, lng, email, email_secondary, phone, website, facebook_url, contact_person"
    )
    .order(SORT_OPTIONS[sortKey].column, { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    return <p className="text-red-600">Failed to load donors: {error.message}</p>;
  }

  const donors = (data ?? []) as DonorRow[];

  return (
    <div>
      <h1 className="text-xl font-bold">Donors</h1>
      <p className="mt-1 text-sm text-gray-500">
        {donors.length} total — shops and businesses on the Friends of Animals map
      </p>

      <div className="mt-6">
        <AddDonorForm />
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Sort by:</span>
        {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
          <Link
            key={key}
            href={`/admin/donors?sort=${key}`}
            className={
              sortKey === key
                ? "rounded bg-black px-2 py-1 font-bold text-wasp-yellow"
                : "rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
            }
          >
            {SORT_OPTIONS[key].label}
          </Link>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Coordinates</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Secondary email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Website</th>
              <th className="px-3 py-2">Facebook</th>
              <th className="px-3 py-2">Reference person</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{d.code ?? "—"}</td>
                <td className="px-3 py-2">{d.name}</td>
                <td className="px-3 py-2">{d.city}</td>
                <td className="px-3 py-2">{d.country ?? "—"}</td>
                <td className="px-3 py-2">{d.address ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {d.lat != null && d.lng != null ? `${d.lat}, ${d.lng}` : "—"}
                </td>
                <td className="px-3 py-2">{d.email ?? "—"}</td>
                <td className="px-3 py-2">{d.email_secondary ?? "—"}</td>
                <td className="px-3 py-2">{d.phone ?? "—"}</td>
                <td className="px-3 py-2">{d.website ?? "—"}</td>
                <td className="px-3 py-2">{d.facebook_url ?? "—"}</td>
                <td className="px-3 py-2">{d.contact_person ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
