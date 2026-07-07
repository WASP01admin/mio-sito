import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type"); // "association" or "donor"

  if (!type || !["association", "donor"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid marker type" },
      { status: 400 }
    );
  }

  const tableName = type === "association" ? "associations" : "donors";

  // Get all markers with message counts (for clustering indicators)
  const selectQuery = type === "donor"
    ? `id, name, website, lat, lng, city, address, is_super_friend`
    : `id, name, website, lat, lng, city, address`;

  // Fetch ALL markers with pagination (Supabase default limit is 1000)
  let allMarkers: any[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: markers, error } = await supabaseAdmin
      .from(tableName)
      .select(selectQuery)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Failed to fetch ${type} markers:`, error);
      return NextResponse.json(
        { error: "Failed to fetch markers" },
        { status: 500 }
      );
    }

    if (!markers || markers.length === 0) break;

    allMarkers = allMarkers.concat(markers);

    if (markers.length < pageSize) break;
    offset += pageSize;
  }

  // Get message counts for each marker
  const { data: allMessages } = await supabaseAdmin
    .from("map_messages")
    .select("marker_id")
    .eq("marker_type", type);

  const countMap = new Map<string, number>();
  if (allMessages) {
    for (const msg of allMessages) {
      countMap.set(msg.marker_id, (countMap.get(msg.marker_id) ?? 0) + 1);
    }
  }

  const markersWithCounts = (allMarkers ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    website: m.website,
    lat: m.lat,
    lng: m.lng,
    city: m.city,
    address: m.address,
    messageCount: countMap.get(m.id) ?? 0,
    ...(m.is_super_friend !== undefined && { is_super_friend: m.is_super_friend }),
  }));

  return NextResponse.json({
    type,
    markers: markersWithCounts,
  });
}
