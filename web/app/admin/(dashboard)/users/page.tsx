import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Search, Users, Mail, MapPin, Calendar, AlertCircle } from "lucide-react";

interface UserRow {
  id: string;
  code: string;
  name: string;
  email: string;
  association_id: string;
  expires_at: string;
}

interface SearchUsersPageProps {
  searchParams: Promise<{ q?: string; type?: string; filter?: string }>;
}

export default async function AdminUsersPage({ searchParams }: SearchUsersPageProps) {
  const { q: searchQuery, type: searchType, filter } = await searchParams;
  const query = searchQuery ? decodeURIComponent(searchQuery).toLowerCase() : "";
  const searchMode = searchType || "auto";

  let results: UserRow[] = [];
  let totalCount = 0;
  let error: string | null = null;

  if (query) {
    try {
      // Search by code, email, or association
      let supabaseQuery = supabaseAdmin
        .from("users")
        .select("id, code, name, email, association_id, expires_at", { count: "exact" });

      if (searchMode === "email" || (searchMode === "auto" && query.includes("@"))) {
        // Email search
        supabaseQuery = supabaseQuery.ilike("email", `%${query}%`);
      } else if (searchMode === "association") {
        // Association search - find users for this association
        supabaseQuery = supabaseQuery.ilike("association_id", `%${query}%`);
      } else {
        // Code or name search (default)
        supabaseQuery = supabaseQuery.or(`code.ilike.%${query}%,name.ilike.%${query}%`);
      }

      // Apply filter if provided
      if (filter === "expiring-soon") {
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        supabaseQuery = supabaseQuery.lt("expires_at", thirtyDaysFromNow);
      } else if (filter === "expired") {
        const today = new Date().toISOString().split("T")[0];
        supabaseQuery = supabaseQuery.lt("expires_at", today);
      }

      const { data, count } = await supabaseQuery.limit(50).order("code", { ascending: true });

      results = data || [];
      totalCount = count || 0;
    } catch (err) {
      error = err instanceof Error ? err.message : "Search failed";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Users Database
          </h1>
          <p className="mt-2 text-gray-600">
            Search and manage user cards across all countries
          </p>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <form method="GET" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="q"
                placeholder={
                  searchType === "association"
                    ? "Type association name (e.g., PETA, Humane Society...)"
                    : searchType === "email"
                      ? "Type email address..."
                      : searchType === "code"
                        ? "Type user code or name..."
                        : "Type association name, code, or email..."
                }
                defaultValue={searchQuery ? decodeURIComponent(searchQuery) : ""}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <select
              name="type"
              defaultValue={searchType || ""}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="">Auto-detect</option>
              <option value="association">By Association</option>
              <option value="email">By Email</option>
              <option value="code">By Code/Name</option>
            </select>

            <select
              name="filter"
              defaultValue={filter || ""}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white text-sm"
            >
              <option value="">All Status</option>
              <option value="expiring-soon">Expiring in 30 days</option>
              <option value="expired">Already Expired</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {searchQuery && (
              <Link
                href="/admin/users"
                className="px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* RESULTS SECTION */}
      {query ? (
        <>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Search Error</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No users found</p>
              <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-gray-900">{totalCount}</span> user
                  {totalCount !== 1 ? "s" : ""} (showing first 50)
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase font-semibold text-gray-700">
                    <tr>
                      <th className="px-4 py-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Code
                      </th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                      </th>
                      <th className="px-4 py-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Association
                      </th>
                      <th className="px-4 py-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Expires
                      </th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((user) => {
                      const expiryDate = new Date(user.expires_at);
                      const today = new Date();
                      const isExpired = expiryDate < today;
                      const daysLeft = Math.ceil(
                        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">
                            {user.code}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-gray-600">{user.association_id || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span
                                className={`text-sm ${
                                  isExpired
                                    ? "text-red-600 font-semibold"
                                    : daysLeft < 30
                                      ? "text-orange-600 font-semibold"
                                      : "text-gray-600"
                                }`}
                              >
                                {isExpired
                                  ? "Expired"
                                  : daysLeft < 0
                                    ? "Expired"
                                    : `${daysLeft}d`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded hover:bg-blue-200 transition">
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <Search className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Search Users</h3>
          <p className="text-blue-700 max-w-md mx-auto">
            Enter a user code (like <code className="bg-blue-100 px-2 py-1 rounded">ITA-USER-0001</code>) or email
            address to find and manage user cards.
          </p>
        </div>
      )}

      {/* STATS SECTION */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">5M+</p>
              <p className="text-xs text-gray-500 mt-2">Across all countries</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Cards</p>
              <p className="text-3xl font-bold text-green-600 mt-1">~4.8M</p>
              <p className="text-xs text-gray-500 mt-2">Not yet expired</p>
            </div>
            <Calendar className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Renewal Due</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">~200K</p>
              <p className="text-xs text-gray-500 mt-2">Next 30 days</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
