import { NextResponse } from "next/server";
import { buildSuggestIndex } from "@/server/suggest";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ entries: buildSuggestIndex() }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
