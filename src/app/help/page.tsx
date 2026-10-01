import { Headphones, Mail, MessageCircle } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SERVICE_FEE_CAP, SERVICE_FEE_RATE } from "@/lib/data/catalog";

export const metadata = buildMetadata({ title: "Help centre", description: "Answers about bookings, pricing, payments, cancellations and your Oriel account.", path: "/help" });

const FAQ: { id: string; title: string; items: [string, string][] }[] = [
  {
    id: "pricing",
    title: "Pricing & fees",
    items: [
      ["Is the price I see the price I pay?", "Yes. Every price on Oriel includes taxes and mandatory fees. Room rates, discounts, extras, taxes and fees are always itemised, and anything collected by the property on arrival (such as a city tax) is shown separately before you pay."],
      ["What is the Oriel service fee?", `A transparent ${SERVICE_FEE_RATE * 100}% fee on the pre-tax subtotal, capped at $${SERVICE_FEE_CAP} per booking. It is always shown as its own line.`],
      ["Why do prices change by date?", "Hotels price nights individually. Weekends and peak seasons cost more; your total is the sum of each night."],
      ["Which currency am I charged in?", "All payments are charged in US dollars. Other currencies are shown at indicative rates for convenience."],
    ],
  },
  {
    id: "cancellation",
    title: "Changes & cancellations",
    items: [
      ["How do I cancel?", "Open the booking from My Trips and choose Manage booking. You'll see exactly how much will be refunded before you confirm."],
      ["What do the cancellation policies mean?", "Free cancellation gives a full refund until the stated date. Partial policies refund a percentage after that date. Non-refundable rates are cheaper but can't be changed."],
      ["How long do refunds take?", "Refunds are issued immediately on our side and usually appear within 5–10 business days, depending on your bank."],
    ],
  },
  {
    id: "payments",
    title: "Payments (demo)",
    items: [
      ["Is this a real booking site?", "No — Oriel is a demonstration platform. All hotels, trips and bookings are fictional and no money is ever taken."],
      ["Which test cards can I use?", "4242 4242 4242 4242 is approved. 4000 0000 0000 0002 is declined, 4000 0000 0000 9995 fails with insufficient funds, and 4000 0000 0000 0119 simulates a processing error. Use any future expiry date and any 3-digit CVC."],
      ["Is my card stored?", "Only the card brand and last four digits are kept. Full card numbers are never stored."],
    ],
  },
  {
    id: "about",
    title: "About Oriel",
    items: [["Who chooses the hotels?", "Our editors visit and review every property we list. We would rather list fewer places we love than thousands we don't know."]],
  },
  {
    id: "terms",
    title: "Booking terms",
    items: [
      ["Booking terms", "Your contract for accommodation, trips and experiences is with the provider named on your confirmation. Oriel acts as the booking agent and collects payment on the provider's behalf."],
      ["Lead guest", "The lead guest must be at least 18 and present at check-in. Photo ID and a card for incidentals may be requested."],
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    items: [["How is my data used?", "We use your details only to manage your bookings and, if you opt in, to send travel notes. In this demo, account and booking data are stored in your browser only."]],
  },
];

export default function HelpPage() {
  return (
    <div className="container-page max-w-5xl pt-10">
      <p className="eyebrow">Help centre</p>
      <h1 className="mt-2 font-display text-5xl text-ink">How can we help?</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Headphones, t: "24/7 concierge", d: "+44 20 7946 0000" },
          { icon: MessageCircle, t: "Live chat", d: "Average reply under 2 minutes" },
          { icon: Mail, t: "Email", d: "concierge@oriel.example" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="size-6 text-gold" aria-hidden />
            <p className="mt-3 font-semibold text-ink">{t}</p>
            <p className="text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      <nav aria-label="Help topics" className="mt-10 flex flex-wrap gap-2">
        {FAQ.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:border-ink/50">
            {s.title}
          </a>
        ))}
      </nav>
      <div className="mt-10 space-y-12">
        {FAQ.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28" aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`} className="font-display text-3xl text-ink">
              {s.title}
            </h2>
            <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
              {s.items.map(([q, a]) => (
                <details key={q} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
