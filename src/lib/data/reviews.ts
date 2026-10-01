import type { Review, ReviewableType, TravelerType } from "@/lib/models";
import { hashString, seededRandom } from "@/lib/seed";
import { EXPERIENCES } from "./experiences";
import { HOTELS } from "./hotels";
import { TRIPS } from "./trips";

const AUTHORS: [string, string][] = [
  ["Sofia R.", "Spain"], ["James T.", "United Kingdom"], ["Mei L.", "Singapore"], ["Lukas B.", "Germany"],
  ["Amara O.", "Nigeria"], ["Chloé D.", "France"], ["Daniel K.", "United States"], ["Priya S.", "India"],
  ["Oliver W.", "Australia"], ["Yuki N.", "Japan"], ["Hannah M.", "Canada"], ["Marco P.", "Italy"],
  ["Leila A.", "United Arab Emirates"], ["Erik J.", "Sweden"], ["Isabel F.", "Portugal"], ["Noah G.", "Netherlands"],
  ["Ava C.", "Ireland"], ["Tomás V.", "Argentina"], ["Nadia H.", "Egypt"], ["Ben S.", "New Zealand"],
];

const TRAVELER_TYPES: TravelerType[] = ["couple", "family", "solo", "business", "friends"];

const HOTEL_TEMPLATES: { t: string; b: string }[] = [
  { t: "Exceeded every expectation", b: "From the welcome drink to the farewell, the team anticipated everything. Our room was immaculate and the view was even better than the photos." },
  { t: "The service made the stay", b: "Staff remembered our names by the second day and the concierge booked us a wonderful dinner we would never have found alone." },
  { t: "Beautiful design, great location", b: "Thoughtful, calm interiors and an easy walk to everything we wanted to see. Breakfast was generous and beautifully presented." },
  { t: "Perfect for a special occasion", b: "We celebrated our anniversary here and they surprised us with flowers and a handwritten note. Truly memorable." },
  { t: "Would happily return", b: "Comfortable beds, excellent shower, quiet at night. The pool area was never crowded even at weekends." },
  { t: "Great value for the quality", b: "Honestly surprised by how much we got for the price. Clean, friendly and exactly as described." },
  { t: "Lovely, with small niggles", b: "A gorgeous property overall. Wi-Fi was patchy in our room and check-in took a while, but the team were apologetic and helpful." },
  { t: "Family heaven", b: "The kids didn't want to leave. Plenty of space, a brilliant kids' programme and staff who were genuinely warm with children." },
];

const ACTIVITY_TEMPLATES: { t: string; b: string }[] = [
  { t: "Highlight of our trip", b: "Our guide was knowledgeable, funny and clearly loves what they do. Perfectly paced with time for photos." },
  { t: "Superbly organised", b: "Every detail was taken care of, from pick-up to the last stop. We felt looked after throughout." },
  { t: "Worth every penny", b: "Small group, unhurried and authentic. We learned so much and ate far too well." },
  { t: "Magical experience", b: "Hard to put into words — one of those moments you remember for years. Book it." },
  { t: "Very good, slightly rushed", b: "Loved the content but the last section felt a little hurried. Still highly recommended." },
  { t: "Great for families", b: "Our children (8 and 11) were engaged the whole time. Thoughtful guide who adapted to the group." },
];

function generate(entityType: ReviewableType, entityId: string, avgRating: number, count: number): Review[] {
  const rand = seededRandom(hashString(entityId));
  const templates = entityType === "hotel" ? HOTEL_TEMPLATES : ACTIVITY_TEMPLATES;
  return Array.from({ length: count }, (_, i) => {
    const [author, country] = AUTHORS[Math.floor(rand() * AUTHORS.length)];
    const spread = (rand() - 0.35) * 1.6;
    const rating = Math.max(6, Math.min(10, +(avgRating + spread).toFixed(1)));
    const tpl = rating < 8.4 ? templates[templates.length === 8 ? 6 : 4] : templates[Math.floor(rand() * templates.length)];
    const month = 1 + Math.floor(rand() * 9);
    const day = 1 + Math.floor(rand() * 27);
    return {
      id: `rev-${entityId}-${i + 1}`,
      entityType,
      entityId,
      author,
      country,
      rating,
      title: tpl.t,
      body: tpl.b,
      date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      travelerType: TRAVELER_TYPES[Math.floor(rand() * TRAVELER_TYPES.length)],
      status: i === 0 && rand() > 0.85 ? "pending" : "published",
    } satisfies Review;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export const REVIEWS: Review[] = [
  ...HOTELS.flatMap((h) => generate("hotel", h.id, h.rating, 6)),
  ...TRIPS.flatMap((t) => generate("trip", t.id, t.rating, 5)),
  ...EXPERIENCES.flatMap((e) => generate("experience", e.id, e.rating, 4)),
];
