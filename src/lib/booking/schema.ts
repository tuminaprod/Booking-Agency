import { z } from "zod";
import { isValidISODate } from "@/lib/dates";

/** Shared validation for the checkout. Used for inline form errors and re-validated on the server. */

const isoDate = z.string().refine(isValidISODate, "Choose a valid date");

export const guestSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name").max(60),
  lastName: z.string().trim().min(1, "Enter a last name").max(60),
  email: z.string().trim().email("Enter a valid email address, like name@example.com"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number with country code, like +44 20 7946 0000"),
  country: z.string().trim().min(2, "Select your country of residence"),
});

export const billingSchema = z.object({
  line1: z.string().trim().min(3, "Enter the street address"),
  city: z.string().trim().min(2, "Enter the city"),
  postalCode: z.string().trim().min(2, "Enter the postal code").max(12),
  country: z.string().trim().min(2, "Select the billing country"),
});

export const cardSchema = z.object({
  name: z.string().trim().min(2, "Enter the name as it appears on the card"),
  number: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v), "Enter a valid card number")
    .refine(luhn, "This card number doesn't look right — please check it"),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use the format MM/YY")
    .refine(notExpired, "This card has expired"),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit security code"),
});

export const selectedExtraSchema = z.object({ extraId: z.string(), quantity: z.number().int().min(0).max(10) });

export const bookingRequestSchema = z.object({
  type: z.enum(["hotel", "trip", "experience"]),
  slug: z.string().min(1),
  roomId: z.string().optional(),
  departureId: z.string().optional(),
  timeSlot: z.string().optional(),
  startDate: isoDate,
  endDate: isoDate.optional(),
  adults: z.number().int().min(1).max(16),
  children: z.number().int().min(0).max(10),
  rooms: z.number().int().min(1).max(8).default(1),
  guest: guestSchema,
  specialRequests: z.string().max(1000).optional(),
  extras: z.array(selectedExtraSchema).max(20),
  promoCode: z.string().max(40).optional(),
  card: cardSchema,
  billing: billingSchema,
  /** Total the customer saw — the server rejects the booking if its own calculation differs. */
  expectedTotal: z.number().nonnegative(),
  acceptTerms: z.literal(true, { message: "Please accept the booking terms to continue" }),
});

export type BookingRequest = z.input<typeof bookingRequestSchema>;
export type ParsedBookingRequest = z.output<typeof bookingRequestSchema>;

export function luhn(num: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function notExpired(v: string): boolean {
  const [mm, yy] = v.split("/").map(Number);
  const now = new Date();
  const year = 2000 + yy;
  return year > now.getFullYear() || (year === now.getFullYear() && mm >= now.getMonth() + 1);
}

export function cardBrand(num: string): "visa" | "mastercard" | "amex" | "unknown" {
  const n = num.replace(/\s+/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
}

/** Flattens zod issues into { "guest.email": "message" } for inline field errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
