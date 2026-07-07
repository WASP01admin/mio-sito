import { NextRequest, NextResponse } from "next/server";
import type { AssociationSearchResult } from "@wasp/shared";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 10;

interface AssociationRow {
  id: string;
  code: string;
  name: string;
  city: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  const { data, error } = await supabaseAdmin.rpc("search_associations", {
    search_query: query,
    result_limit: RESULT_LIMIT,
  });

  if (error) {
    console.error("Association search failed:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const rows = (data ?? []) as AssociationRow[];
  const results: AssociationSearchResult[] = rows.map((assoc) => ({
    id: assoc.id,
    code: assoc.code,
    name: assoc.name,
    city: assoc.city,
  }));

  return NextResponse.json({ results });
}
