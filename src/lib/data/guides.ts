import type { TravelGuide } from "@/lib/models";
import { img } from "./photos";

const EDITORS = {
  clara: { name: "Clara Whitfield", role: "Senior Travel Editor" },
  kenji: { name: "Kenji Arai", role: "Asia Correspondent" },
  ines: { name: "Inès Morel", role: "Food & Culture Writer" },
  sam: { name: "Sam Okafor", role: "Family Travel Editor" },
};

export const GUIDES: TravelGuide[] = [
  {
    id: "gd-kyoto-guide",
    slug: "kyoto-first-timers-guide",
    title: "Kyoto for First-Timers: How to See the City Slowly",
    excerpt: "Temples at dawn, tea in the afternoon and river dinners by lantern light — a calm approach to Japan's cultural capital.",
    category: "destination-guides",
    author: EDITORS.kenji,
    publishedAt: "2026-08-12",
    updatedAt: "2026-09-18",
    readingMinutes: 9,
    heroImage: img("kyotoPagoda", "Pagoda above Kyoto at sunset"),
    sections: [
      {
        id: "when-to-go",
        heading: "When to go",
        blocks: [
          { type: "p", text: "Kyoto is beautiful all year, but it changes character with the seasons. Late March to early April brings cherry blossom and the biggest crowds; mid-November paints the hills red and gold. For quieter streets, consider early December or late January, when crisp blue skies frame the temples." },
          { type: "tip", title: "Book early for peak seasons", text: "Ryokan and boutique hotels near Higashiyama sell out months ahead for blossom and foliage weeks. Flexible, free-cancellation rates are worth the small premium." },
        ],
      },
      {
        id: "where-to-stay",
        heading: "Where to stay",
        blocks: [
          { type: "p", text: "Stay in Higashiyama for atmosphere — stone-paved lanes, wooden teahouses and temples on your doorstep. Downtown around Kawaramachi is more practical for restaurants and transport, and riverside hotels offer the best of both." },
          { type: "list", items: ["Higashiyama — for early-morning temple walks", "Gion — for evening strolls and dining", "Downtown — for shopping, food and easy transit", "Arashiyama — for a peaceful, nature-filled night"] },
        ],
      },
      {
        id: "a-perfect-day",
        heading: "A perfect first day",
        blocks: [
          { type: "p", text: "Start at Fushimi Inari before 7 am, when the torii tunnels are silent. After breakfast, head to Higashiyama and wander up to Kiyomizu-dera through Sannenzaka. Spend the afternoon at a tea ceremony, then cross to Pontocho for dinner overlooking the Kamo River." },
          { type: "image", image: img("kyotoStreet", "Higashiyama lane with Yasaka Pagoda"), caption: "Higashiyama's lanes are at their best before 8 am." },
        ],
      },
      {
        id: "etiquette",
        heading: "Etiquette worth knowing",
        blocks: [
          { type: "list", items: ["Remove shoes where you see a raised step or slippers.", "Never photograph geiko or maiko without permission.", "Keep voices low on buses and in temples.", "Tipping is not expected — excellent service is the norm."] },
          { type: "quote", text: "In Kyoto, the most memorable moments are often the quietest ones.", cite: "Kenji Arai" },
        ],
      },
    ],
    relatedDestinationIds: ["dst-kyoto", "dst-tokyo"],
    relatedHotelIds: ["htl-hanami-ryokan-higashiyama", "htl-kamo-river-house"],
    relatedExperienceIds: ["exp-kyoto-tea-ceremony", "exp-kyoto-arashiyama-dawn-walk"],
  },
  {
    id: "gd-rome-things",
    slug: "things-to-do-in-rome",
    title: "18 Unmissable Things to Do in Rome",
    excerpt: "From the arena floor of the Colosseum to the city's best maritozzo — how to fill your days in the Eternal City.",
    category: "things-to-do",
    author: EDITORS.clara,
    publishedAt: "2026-07-02",
    readingMinutes: 11,
    heroImage: img("colosseum", "The Colosseum under a dramatic sky"),
    sections: [
      {
        id: "ancient-rome",
        heading: "Ancient Rome",
        blocks: [
          { type: "p", text: "Book an early-access tour of the Colosseum to stand on the arena floor before the gates open. Continue through the Roman Forum and up Palatine Hill for views over the Circus Maximus." },
          { type: "list", items: ["Colosseum arena floor", "Roman Forum & Palatine Hill", "The Pantheon at opening time", "Baths of Caracalla at sunset"] },
        ],
      },
      {
        id: "art-and-churches",
        heading: "Art & churches",
        blocks: [
          { type: "p", text: "The Borghese Gallery limits visitors to two-hour slots — reserve well ahead. For Caravaggio without the queues, visit San Luigi dei Francesi and Santa Maria del Popolo." },
          { type: "tip", title: "Evening Vatican", text: "On select nights, the Vatican Museums open late. Fewer crowds, and the Sistine Chapel feels far more intimate." },
        ],
      },
      {
        id: "eat-like-a-roman",
        heading: "Eat like a Roman",
        blocks: [
          { type: "list", items: ["Cacio e pepe in Trastevere", "Supplì from a Testaccio friggitoria", "Maritozzo for breakfast", "Gelato made with seasonal fruit"] },
          { type: "image", image: img("fineDining", "Dinner table set in a Roman restaurant"), caption: "Many of Rome's best trattorias open for dinner no earlier than 19:30." },
        ],
      },
    ],
    relatedDestinationIds: ["dst-rome", "dst-venice"],
    relatedHotelIds: ["htl-palazzo-aurelio", "htl-trastevere-loft-rooms"],
    relatedExperienceIds: ["exp-rome-colosseum-private-tour"],
  },
  {
    id: "gd-booking-tips",
    slug: "smart-hotel-booking-tips",
    title: "Smart Hotel Booking: 10 Tips From Our Editors",
    excerpt: "How to read cancellation policies, when to book, and why the total price is the only price that matters.",
    category: "travel-tips",
    author: EDITORS.clara,
    publishedAt: "2026-09-05",
    readingMinutes: 7,
    heroImage: img("travelFlatlay", "Map, camera and travel essentials"),
    sections: [
      {
        id: "total-price",
        heading: "Always compare the total price",
        blocks: [
          { type: "p", text: "Nightly rates rarely tell the whole story. Taxes, city levies and resort fees can add 10–30% to a stay. On Oriel, every price you see includes an itemised breakdown so you can compare like for like." },
          { type: "tip", title: "Paid at the property", text: "Some local taxes are collected on arrival. We show these clearly, separately from what you pay today." },
        ],
      },
      {
        id: "cancellation",
        heading: "Understand cancellation policies",
        blocks: [
          { type: "list", items: ["Free cancellation — full refund until a stated date.", "Partial — free until a date, then a percentage refund.", "Non-refundable — cheapest, but no changes."] },
          { type: "p", text: "If your plans are firm, a non-refundable rate can save 10–15%. If not, flexibility is worth the small premium." },
        ],
      },
      {
        id: "timing",
        heading: "Timing your booking",
        blocks: [
          { type: "p", text: "For peak seasons and small boutique properties, book three to six months ahead. City hotels often release good-value rates two to four weeks out." },
        ],
      },
    ],
    relatedDestinationIds: ["dst-paris", "dst-santorini"],
    relatedHotelIds: ["htl-hotel-rive-claire"],
    relatedExperienceIds: [],
  },
  {
    id: "gd-santorini-hotels",
    slug: "best-hotels-in-santorini",
    title: "The Best Hotels in Santorini, From Cave Suites to Family Villas",
    excerpt: "Our editors' pick of where to stay on the caldera, the quiet north and the beaches.",
    category: "best-hotels",
    author: EDITORS.clara,
    publishedAt: "2026-06-20",
    readingMinutes: 6,
    heroImage: img("cliffResort", "Infinity pool on the caldera"),
    sections: [
      {
        id: "caldera",
        heading: "For caldera views",
        blocks: [
          { type: "p", text: "Imerovigli sits at the highest point of the rim, with sunset views that rival Oia's — without the crowds. Kalliste Cliff Suites is our top pick for its heated plunge pools and farm-to-table dining." },
          { type: "image", image: img("cliffsideSunset", "Sunset from a cliffside terrace"), caption: "Sunset from the caldera rim in Imerovigli." },
        ],
      },
      {
        id: "families",
        heading: "For families",
        blocks: [
          { type: "p", text: "Look for villas with kitchens and shared pools on Oia's northern edge, or head to the black-sand beaches of Kamari and Perissa." },
        ],
      },
      {
        id: "tips",
        heading: "Before you book",
        blocks: [
          { type: "list", items: ["Caldera suites often involve many steps.", "A climate resilience fee is charged per night at the hotel.", "Book sunset restaurants a week ahead in summer."] },
        ],
      },
    ],
    relatedDestinationIds: ["dst-santorini"],
    relatedHotelIds: ["htl-kalliste-cliff-suites", "htl-aspro-villas-oia"],
    relatedExperienceIds: ["exp-santorini-sunset-catamaran", "exp-santorini-wine-tasting"],
  },
  {
    id: "gd-istanbul-food",
    slug: "istanbul-food-guide",
    title: "An Istanbul Food Guide: From Simit to Meyhane",
    excerpt: "Breakfast spreads, fish sandwiches, kebab institutions and long meze nights on both sides of the Bosphorus.",
    category: "food-guides",
    author: EDITORS.ines,
    publishedAt: "2026-05-14",
    readingMinutes: 8,
    heroImage: img("foodSpread", "A spread of shared dishes"),
    sections: [
      {
        id: "breakfast",
        heading: "Start with kahvaltı",
        blocks: [
          { type: "p", text: "A Turkish breakfast is a feast: cheeses, olives, honey with clotted cream, eggs cooked with sucuk, and endless tea. Head to Beşiktaş's breakfast street on a weekend morning." },
        ],
      },
      {
        id: "street-food",
        heading: "Street food essentials",
        blocks: [
          { type: "list", items: ["Simit — sesame bread rings", "Balık ekmek — grilled fish sandwiches at Eminönü", "Midye dolma — stuffed mussels", "Kokoreç — for the adventurous"] },
          { type: "tip", title: "Cross to Kadıköy", text: "The Asian side's market streets are where locals shop — and where you'll find some of the city's best meze." },
        ],
      },
      {
        id: "meyhane",
        heading: "A night at the meyhane",
        blocks: [
          { type: "p", text: "Meyhane dinners are slow, social affairs: cold meze, then hot, then fish, all washed down with rakı. Book ahead on Fridays and Saturdays." },
        ],
      },
    ],
    relatedDestinationIds: ["dst-istanbul", "dst-cappadocia"],
    relatedHotelIds: ["htl-galata-konak-hotel", "htl-bosphorus-pearl-palace"],
    relatedExperienceIds: ["exp-istanbul-bosphorus-sunset-cruise"],
  },
  {
    id: "gd-paris-48",
    slug: "48-hours-in-paris",
    title: "48 Hours in Paris: A Perfect Weekend Itinerary",
    excerpt: "Galleries, bistros and a Seine cruise — how to make two days in Paris feel like a week.",
    category: "weekend-itineraries",
    author: EDITORS.ines,
    publishedAt: "2026-09-10",
    readingMinutes: 6,
    heroImage: img("parisBridge", "Pont Alexandre III at twilight"),
    sections: [
      {
        id: "saturday",
        heading: "Saturday",
        blocks: [
          { type: "list", items: ["09:00 — Coffee and croissants in Saint-Germain", "10:00 — Musée d'Orsay (pre-booked)", "13:00 — Lunch formule at a neighbourhood bistro", "15:00 — Jardin du Luxembourg", "20:30 — Seine dinner cruise"] },
        ],
      },
      {
        id: "sunday",
        heading: "Sunday",
        blocks: [
          { type: "list", items: ["10:00 — Marais food walk", "13:00 — Place des Vosges picnic", "15:00 — Musée Picasso", "18:00 — Sunset from Sacré-Cœur"] },
          { type: "tip", title: "Sunday openings", text: "Many shops close on Sundays, but the Marais is a notable exception." },
        ],
      },
    ],
    relatedDestinationIds: ["dst-paris"],
    relatedHotelIds: ["htl-maison-lumen-saint-germain", "htl-hotel-rive-claire"],
    relatedExperienceIds: ["exp-paris-seine-dinner-cruise", "exp-paris-market-cooking-class"],
  },
  {
    id: "gd-phuket-family",
    slug: "phuket-with-kids",
    title: "Phuket With Kids: Beaches, Boats and Easy Adventures",
    excerpt: "The calmest beaches, the best family resorts and day trips that work for little legs.",
    category: "family-travel",
    author: EDITORS.sam,
    publishedAt: "2026-04-22",
    readingMinutes: 7,
    heroImage: img("turquoiseBoats", "Longtail boats on turquoise water"),
    sections: [
      {
        id: "beaches",
        heading: "The best beaches for families",
        blocks: [
          { type: "p", text: "Kata, Kata Noi and Kamala have gentle slopes and lifeguards in high season. Avoid swimming during the southwest monsoon (May–October) when rip currents are strong." },
        ],
      },
      {
        id: "day-trips",
        heading: "Day trips that work",
        blocks: [
          { type: "list", items: ["Sea-kayaking into Phang Nga Bay's lagoons", "Island hopping to Koh Yao Noi", "A Thai cooking class designed for kids", "Old Town murals and the Sunday market"] },
          { type: "tip", title: "Pace it", text: "Alternate big days out with pool days — the heat is tiring for children." },
        ],
      },
    ],
    relatedDestinationIds: ["dst-phuket", "dst-bali"],
    relatedHotelIds: ["htl-andaman-cove-resort", "htl-kata-hillside-villas"],
    relatedExperienceIds: ["exp-phang-nga-bay-sea-kayak"],
  },
  {
    id: "gd-maldives-luxury",
    slug: "maldives-luxury-guide",
    title: "The Maldives, Done Beautifully: A Luxury Guide",
    excerpt: "How to choose your island, which villa to book and the experiences worth the splurge.",
    category: "luxury-travel",
    author: EDITORS.clara,
    publishedAt: "2026-03-30",
    readingMinutes: 8,
    heroImage: img("maldivesVilla", "Overwater villas at sunset"),
    sections: [
      {
        id: "choosing",
        heading: "Choosing your island",
        blocks: [
          { type: "p", text: "Transfer time matters. Speedboat-accessible resorts in the North and South Malé atolls mean you can be in the water within an hour of landing. Check whether transfers are included — they can add significantly to the total." },
        ],
      },
      {
        id: "villa",
        heading: "Overwater or beach?",
        blocks: [
          { type: "list", items: ["Overwater — lagoon access, privacy, the iconic view.", "Beach — more space, gardens, easier for families."] },
          { type: "image", image: img("overwaterInterior", "Lagoon view from an overwater villa"), caption: "Waking up to this never gets old." },
        ],
      },
      {
        id: "splurges",
        heading: "Worth the splurge",
        blocks: [
          { type: "list", items: ["A private sandbank dinner", "A guided dive with a marine biologist", "An overwater spa ritual"] },
        ],
      },
    ],
    relatedDestinationIds: ["dst-maldives", "dst-bali"],
    relatedHotelIds: ["htl-nalu-lagoon-retreat", "htl-coral-veil-island-resort"],
    relatedExperienceIds: ["exp-maldives-reef-discovery-dive"],
  },
];
