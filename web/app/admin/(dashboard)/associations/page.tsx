import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AddAssociationForm from "@/components/admin/AddAssociationForm";
import AssociationsTable from "@/components/admin/AssociationsTable";

interface AssociationRow {
  id: string;
  code: string;
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
  password: string | null;
}

interface EditFormData {
  id: string;
  code: string;
  name: string;
  country: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  instagram: string | null;
  email_secondary: string | null;
  postal_code: string | null;
  contact_person: string | null;
  extra_details: string | null;
  password: string | null;
}

interface AssociationsPageProps {
  searchParams: Promise<{ sort?: string; country?: string; page?: string; search?: string }>;
}

const SORT_OPTIONS = {
  code: { column: "code", label: "Code" },
  name: { column: "name", label: "Name" },
  country: { column: "country", label: "Country" },
  map: { column: "map", label: "Map Status" },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

function isSortKey(value: string | undefined): value is SortKey {
  return value === "code" || value === "name" || value === "country" || value === "map";
}

export default async function AdminAssociationsPage({
  searchParams,
}: AssociationsPageProps) {
  const { sort, country, page: pageStr, search } = await searchParams;
  const sortKey: SortKey = isSortKey(sort) ? sort : "code";
  const page = Math.max(1, parseInt(pageStr || "1"));
  const pageSize = 100; // Show 100 per page
  const offset = (page - 1) * pageSize;
  const searchQuery = search ? decodeURIComponent(search).toLowerCase() : "";

  // Get ACCURATE counts (no limit)
  let countQuery = supabaseAdmin
    .from("associations")
    .select("id", { count: "exact", head: true });

  if (searchQuery) {
    countQuery = countQuery.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
  }

  if (country && country !== "all") {
    countQuery = countQuery.eq("country", decodeURIComponent(country));
  }

  const { count: filteredCount } = await countQuery;
  const totalPages = Math.ceil((filteredCount || 0) / pageSize);

  // Get paginated data
  let query = supabaseAdmin
    .from("associations")
    .select(
      "id, code, name, city, country, address, lat, lng, email, email_secondary, phone, website, facebook_url, contact_person, password"
    );

  if (searchQuery) {
    query = query.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
  }

  if (country && country !== "all") {
    query = query.eq("country", decodeURIComponent(country));
  }

  const { data, error } = await query
    .order(sortKey === "map" ? "lat" : SORT_OPTIONS[sortKey].column, {
      ascending: sortKey === "map" ? false : true,
      nullsFirst: sortKey === "map" ? true : false
    })
    .order("name", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return <p className="text-red-600">Failed to load associations: {error.message}</p>;
  }

  let associations = (data ?? []) as AssociationRow[];

  // Client-side sort for map status: OFF MAP first, then ON MAP
  if (sortKey === "map") {
    associations.sort((a, b) => {
      const aOnMap = a.lat !== null && a.lng !== null;
      const bOnMap = b.lat !== null && b.lng !== null;
      if (aOnMap === bOnMap) return 0;
      return aOnMap ? 1 : -1; // OFF MAP comes first
    });
  }

  // Get unique countries and their counts (accurate, no limit)
  // Fetch ALL records by paginating in 1000-record chunks (Supabase hard limit per query)
  // DO NOT change countryPageSize—Supabase enforces max 1000 records per .range() call
  let allCountriesList: Array<{ country: string | null }> = [];
  let countryOffset = 0;
  const countryPageSize = 1000;

  let countryFetchMore = true;
  while (countryFetchMore) {
    let countryQuery = supabaseAdmin
      .from("associations")
      .select("country")
      .range(countryOffset, countryOffset + countryPageSize - 1);

    if (searchQuery) {
      countryQuery = countryQuery.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
    }

    const { data } = await countryQuery;
    console.log(`Fetch attempt ${Math.floor(countryOffset / countryPageSize) + 1}: got ${data?.length || 0} records (total so far: ${allCountriesList.length + (data?.length || 0)})`);

    if (!data || data.length === 0) {
      countryFetchMore = false;
    } else {
      allCountriesList = allCountriesList.concat(data);
      if (data.length < countryPageSize) {
        countryFetchMore = false;
      }
      countryOffset += countryPageSize;
    }
  }

  const countryMap = new Map<string, number>();
  allCountriesList.forEach((row) => {
    if (row.country) {
      countryMap.set(row.country, (countryMap.get(row.country) ?? 0) + 1);
    }
  });

  const countries = Array.from(countryMap.entries()).sort((a, b) =>
    b[1] - a[1]
  );

  const totalAllCountries = allCountriesList.length;

  const PaginationControls = () => (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={`/admin/associations?page=${page - 1}${sort ? `&sort=${sort}` : ""}${
              country ? `&country=${country}` : ""
            }${search ? `&search=${search}` : ""}`}
            className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          >
            ← Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={`/admin/associations?page=${page + 1}${sort ? `&sort=${sort}` : ""}${
              country ? `&country=${country}` : ""
            }${search ? `&search=${search}` : ""}`}
            className="rounded bg-wasp-yellow px-3 py-1 text-sm font-semibold hover:bg-yellow-400"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-start gap-6">
        <div>
          <h1 className="text-xl font-bold">Associations Database</h1>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredCount || 0} total</span> associations
            {country && country !== "all"
              ? ` in ${decodeURIComponent(country)}`
              : " across all countries"}
            {filteredCount && filteredCount > pageSize && (
              <span className="ml-2 text-gray-600">
                (showing {offset + 1}–{Math.min(offset + pageSize, filteredCount || 0)})
              </span>
            )}
          </p>
        </div>

        {/* IMPORT GOSPEL - Always visible reference */}
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-xs max-w-xs">
          <div className="font-bold text-amber-900 mb-2">🧭 Import Gospel</div>
          <div className="space-y-1 text-amber-800 font-mono text-xs">
            <div><span className="text-amber-600">#1</span> cp import_country_template.js import_[country].js</div>
            <div><span className="text-amber-600">#2</span> Edit CONFIGURATION section</div>
            <div><span className="text-amber-600">#3</span> node import_[country].js</div>
            <div><span className="text-amber-600">#4</span> Verify + Done</div>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-200 text-amber-700 text-xs">
            <div className="font-semibold">ONE PROCESS.</div>
            <div className="font-semibold">ALL COUNTRIES.</div>
            <div className="font-semibold">100% CONSISTENCY.</div>
          </div>
        </div>

        {/* BULK UPDATE REFERENCE - For updating existing data */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-xs max-w-xs">
          <div className="font-bold text-blue-900 mb-2">📝 Bulk Update</div>
          <div className="space-y-2 text-blue-800 font-mono text-xs">
            <div>For updating lat/lng/emails in bulk:</div>
            <div className="bg-white p-2 rounded border border-blue-200 break-all">
              node update_associations_bulk.js
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-blue-700 text-xs">
            <div>Individual edits? Click "Edit" on any row above.</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <AddAssociationForm />

        {/* SEARCH FIELD */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search by code or name..."
              defaultValue={search ? decodeURIComponent(search) : ""}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-wasp-yellow px-4 py-2 font-semibold hover:bg-yellow-400"
            >
              Search
            </button>
            {search && (
              <Link
                href={`/admin/associations${country ? `?country=${country}` : ""}`}
                className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
              >
                Clear
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* TOP PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-4">
          <PaginationControls />
        </div>
      )}

      {/* Country Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Link
          href="/admin/associations?country=all"
          className={`rounded-lg border-2 p-3 text-center transition ${
            country === "all" || !country
              ? "border-wasp-yellow bg-yellow-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-lg font-bold text-gray-900">
            {totalAllCountries}
          </div>
          <div className="text-xs text-gray-600">All Countries</div>
        </Link>
        {countries.map(([countryName, count]) => (
          <Link
            key={countryName}
            href={`/admin/associations?country=${encodeURIComponent(
              countryName
            )}`}
            className={`rounded-lg border-2 p-3 text-center transition ${
              country === encodeURIComponent(countryName)
                ? "border-wasp-yellow bg-yellow-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-lg font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-600">{countryName}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Sort by:</span>
        {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
          <Link
            key={key}
            href={`/admin/associations?sort=${key}${country && country !== "all" ? `&country=${country}` : ""}`}
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

      <div className="mt-3">
        <AssociationsTable associations={associations} />
      </div>

      {/* BOTTOM PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls />
        </div>
      )}
    </div>
  );
}
