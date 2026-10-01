import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validatePromotion } from "@/lib/booking/promotions";
import { todayISO } from "@/lib/dates";
import { listPromotions } from "@/server/catalog";

const schema = z.object({
  code: z.string().max(40),
  type: z.enum(["hotel", "trip", "experience"]),
  subtotal: z.number().nonnegative(),
  nights: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid request." }, { status: 400 });
  const result = validatePromotion(parsed.data.code, listPromotions(), { ...parsed.data, today: todayISO() });
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
