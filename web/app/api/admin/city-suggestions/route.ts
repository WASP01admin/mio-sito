import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// ISO 3166-1 alpha-3 to alpha-2 country code mapping
const COUNTRY_CODE_2_LETTER: Record<string, string> = {
  ITA: "IT",
  GBR: "GB",
  FRA: "FR",
  DEU: "DE",
  ESP: "ES",
  NLD: "NL",
  BEL: "BE",
  CHE: "CH",
  AUT: "AT",
  POL: "PL",
  CZE: "CZ",
  SVK: "SK",
  HUN: "HU",
  ROU: "RO",
  BGR: "BG",
  HRV: "HR",
  SVN: "SI",
  GRC: "GR",
  PRT: "PT",
  DNK: "DK",
  SWE: "SE",
  NOR: "NO",
  FIN: "FI",
  RUS: "RU",
  UKR: "UA",
  USA: "US",
  CAN: "CA",
  MEX: "MX",
  BRA: "BR",
  ARG: "AR",
  CHL: "CL",
  AUS: "AU",
  NZL: "NZ",
  JPN: "JP",
  CHN: "CN",
  IND: "IN",
  ZAF: "ZA",
  EGY: "EG",
  NGA: "NG",
  KEN: "KE",
  ISR: "IL",
  SGP: "SG",
  MYS: "MY",
  THA: "TH",
  IDN: "ID",
  PHL: "PH",
  VNM: "VN",
  KOR: "KR",
  TWN: "TW",
  LUX: "LU",
};

interface GeoNamesResult {
  name: string;
  adminName1?: string;
  countryName: string;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const country = searchParams.get("country");
  const countryCode = searchParams.get("countryCode");

  if (!q) {
    return NextResponse.json({ ok: false, error: "missing_query" }, { status: 400 });
  }

  // Get 2-letter country code from 3-letter code or country name
  let twoLetterCode: string | undefined;
  if (countryCode) {
    twoLetterCode = COUNTRY_CODE_2_LETTER[countryCode.toUpperCase()];
  }

  if (!twoLetterCode && !country) {
    return NextResponse.json({ ok: false, error: "missing_country" }, { status: 400 });
  }

  try {
    // Use GeoNames API for city autocomplete
    const geonamesUrl = new URL("http://api.geonames.org/searchJSON");
    geonamesUrl.searchParams.append("name_startsWith", q);
    geonamesUrl.searchParams.append("featureClass", "P"); // Populated places only
    geonamesUrl.searchParams.append("maxRows", "20");
    geonamesUrl.searchParams.append("username", process.env.GEONAMES_USERNAME || "wasp_project");

    // Add country filter if available (GeoNames uses 'country' parameter, not 'countryCode')
    if (twoLetterCode) {
      geonamesUrl.searchParams.append("country", twoLetterCode);
    }

    const response = await fetch(geonamesUrl.toString());
    const data = await response.json();

    if (!data.geonames || !Array.isArray(data.geonames)) {
      return NextResponse.json({
        ok: true,
        suggestions: [],
      });
    }

    // Map results: city name + state/province for disambiguation
    const cityMap = new Map<string, string>();

    data.geonames.forEach((place: GeoNamesResult) => {
      const cityName = place.name;
      const state = place.adminName1;

      // Create display name: "City, State" format
      const displayName = state ? `${cityName}, ${state}` : cityName;

      // Only add if not duplicate
      if (!cityMap.has(displayName)) {
        cityMap.set(displayName, displayName);
      }
    });

    // Convert to array and sort alphabetically
    const suggestions = Array.from(cityMap.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({
      ok: true,
      suggestions: suggestions.slice(0, 12),
    });
  } catch (error) {
    console.error("GeoNames city suggestions error:", error);
    return NextResponse.json(
      { ok: false, error: "suggestions_failed" },
      { status: 500 }
    );
  }
}
