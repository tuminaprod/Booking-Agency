import { NextResponse, type NextRequest } from "next/server";
import { createBooking } from "@/server/bookings";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const result = await createBooking(body);
  if (!result.ok) {
    return NextResponse.json({ code: result.code, message: result.message, fieldErrors: result.fieldErrors }, { status: result.status });
  }
  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
