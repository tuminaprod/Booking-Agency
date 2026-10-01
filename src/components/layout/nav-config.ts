export const MAIN_NAV = [
  { href: "/hotels", label: "Hotels" },
  { href: "/trips", label: "Trips" },
  { href: "/experiences", label: "Experiences" },
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Travel Guides" },
  { href: "/deals", label: "Deals" },
] as const;

/** Routes where the mobile bottom bar is replaced by a contextual sticky CTA. */
export const HIDE_BOTTOM_NAV = [/^\/hotels\/[^/]+$/, /^\/trips\/[^/]+$/, /^\/experiences\/[^/]+$/, /^\/book\//, /^\/admin/, /^\/auth\//];
