import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

async function geocodeQuery(query: string): Promise<any> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "WASP-Association-Admin",
      },
    }
  );
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const city = searchParams.get("city");
  const country = searchParams.get("country");

  if (!q) {
    return NextResponse.json({ ok: false, error: "missing_query" }, { status: 400 });
  }

  try {
    let result = null;

    // Try 1: Full query (street-level)
    result = await geocodeQuery(q);

    // Try 2: Fallback to city + country (city-level)
    if (!result && city && country) {
      const cityQuery = `${city}, ${country}`;
      result = await geocodeQuery(cityQuery);
    }

    // Try 3: Fallback to country only
    if (!result && country) {
      result = await geocodeQuery(country);
    }

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "location_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { ok: false, error: "geocoding_failed" },
      { status: 500 }
    );
  }
}
