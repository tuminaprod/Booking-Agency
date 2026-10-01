import { NextResponse, type NextRequest } from "next/server";
import { parseHotelQuery } from "@/lib/search/hotel-query";
import { defaultStay } from "@/lib/dates";
import { searchHotels } from "@/server/hotel-search";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // QA hook: /api/hotels/search?simulate=error returns a 503 to exercise the error state.
  if (sp.get("simulate") === "error") {
    return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 });
  }
  const query = parseHotelQuery(sp, defaultStay());
  const result = searchHotels(query);
  return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=30" } });
}
