import Link from "next/link";
import { Lock, ShieldCheck, Headphones } from "lucide-react";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/hotels", label: "Hotels" },
      { href: "/trips", label: "Trips" },
      { href: "/experiences", label: "Experiences" },
      { href: "/destinations", label: "Destinations" },
      { href: "/deals", label: "Deals" },
    ],
  },
  {
    title: "Inspiration",
    links: [
      { href: "/guides", label: "Travel guides" },
      { href: "/guides?category=luxury-travel", label: "Luxury travel" },
      { href: "/guides?category=family-travel", label: "Family travel" },
      { href: "/guides?category=weekend-itineraries", label: "Weekend itineraries" },
    ],
  },
  {
    title: "Your trips",
    links: [
      { href: "/account?tab=trips", label: "Manage bookings" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/auth/sign-up", label: "Create an account" },
      { href: "/help", label: "Help centre" },
    ],
  },
  {
    title: "Oriel",
    links: [
      { href: "/help#about", label: "About us" },
      { href: "/help#pricing", label: "Price transparency" },
      { href: "/help#terms", label: "Terms & conditions" },
      { href: "/help#privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer data-site-footer className="mt-24 bg-navy pb-20 text-white/80 lg:pb-0">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Total price, upfront", text: "Taxes and fees shown before you book." },
            { icon: Lock, title: "Secure payments", text: "Encrypted checkout, charged in USD." },
            { icon: Headphones, title: "24/7 concierge", text: "Real people, whenever you need us." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-gold-soft" aria-hidden />
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-white/70">Considered stays, curated journeys and unforgettable experiences — chosen by people who travel for a living.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-soft">{col.title}</h2>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-[0.9375rem] text-white/75 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oriel Travel. A demonstration platform — all properties and bookings are fictional.</p>
          <p>Hotels · Trips · Experiences</p>
        </div>
      </div>
    </footer>
  );
}
