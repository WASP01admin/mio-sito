import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

interface NominatimResult {
  display_name: string;
  address: Record<string, string>;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const city = searchParams.get("city");
  const country = searchParams.get("country");

  if (!q || !city || !country) {
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
  }

  try {
    // Remove generic street type words (via, piazza, street, avenue, boulevard, corso, viale, etc.)
    const genericWords = /^(via|piazza|street|avenue|boulevard|corso|viale|road|lane|drive|place|court|square|st|pl|ave|blvd|dr|ln|ct|sq)\s+/i;
    const cleanedQ = q.replace(genericWords, "").trim();

    // If query is empty after removing generic words, return empty suggestions
    if (!cleanedQ) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    // Use Nominatim for street-level address autocomplete
    // Search for addresses within the specific city and country
    const query = `${cleanedQ}, ${city}, ${country}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=20&addresstype=street`,
      {
        headers: {
          "User-Agent": "WASP-Association-Admin",
        },
      }
    );

    const data = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({
        ok: true,
        suggestions: [],
      });
    }

    // Extract street addresses and deduplicate
    const addressSet = new Set<string>();

    data.forEach((item: NominatimResult) => {
      const address = item.address || {};

      // Build street address from components
      let streetAddress = "";

      if (address.road || address.street) {
        streetAddress = address.road || address.street;
      } else if (address.house_number) {
        streetAddress = address.house_number;
      }

      // If we got a street address, add it
      if (streetAddress && !addressSet.has(streetAddress)) {
        addressSet.add(streetAddress);
      }

      // Also try the full display name if it's different and useful
      const displayName = item.display_name;
      if (displayName && displayName.includes(city) && !addressSet.has(displayName)) {
        addressSet.add(displayName);
      }
    });

    // Convert to array and sort alphabetically
    const suggestions = Array.from(addressSet).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({
      ok: true,
      suggestions: suggestions.slice(0, 12),
    });
  } catch (error) {
    console.error("Address suggestions error:", error);
    return NextResponse.json(
      { ok: false, error: "suggestions_failed" },
      { status: 500 }
    );
  }
}
