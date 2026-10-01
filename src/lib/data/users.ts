import type { User } from "@/lib/models";

/**
 * Demo accounts for the local auth adapter (src/lib/auth).
 * These are fictional test credentials for this demo only.
 */
export const DEMO_CREDENTIALS = { email: "demo@oriel.travel", password: "Oriel-Demo-2026!" } as const;
export const DEMO_ADMIN_CREDENTIALS = { email: "admin@oriel.travel", password: "Oriel-Admin-2026!" } as const;

export const DEMO_USER: User = {
  id: "usr-demo",
  email: DEMO_CREDENTIALS.email,
  firstName: "Alex",
  lastName: "Morgan",
  phone: "+44 20 7946 0321",
  country: "United Kingdom",
  role: "customer",
  emailVerified: true,
  createdAt: "2024-03-12T10:00:00.000Z",
  preferences: {
    currency: "USD",
    language: "en",
    travelStyle: ["romantic", "cultural", "luxury"],
    notifications: { bookingUpdates: true, priceAlerts: true, tripReminders: true, newsletter: false, sms: false },
  },
  travelers: [
    { id: "trv-1", firstName: "Alex", lastName: "Morgan", relation: "self", dateOfBirth: "1988-06-14" },
    { id: "trv-2", firstName: "Jordan", lastName: "Morgan", relation: "partner", dateOfBirth: "1989-02-02" },
  ],
  paymentMethods: [
    { id: "pm-1", brand: "visa", last4: "4242", expMonth: 8, expYear: 2029, holder: "Alex Morgan", isDefault: true },
    { id: "pm-2", brand: "mastercard", last4: "4444", expMonth: 3, expYear: 2028, holder: "Alex Morgan", isDefault: false },
  ],
};

export const DEMO_ADMIN: User = {
  ...DEMO_USER,
  id: "usr-admin",
  email: DEMO_ADMIN_CREDENTIALS.email,
  firstName: "Robin",
  lastName: "Ellis",
  role: "admin",
  travelers: [],
  paymentMethods: [],
};

/** Fictional customers used to populate admin reservation data. */
export const CUSTOMERS: Pick<User, "id" | "firstName" | "lastName" | "email" | "country" | "createdAt">[] = [
  { id: "usr-demo", firstName: "Alex", lastName: "Morgan", email: DEMO_CREDENTIALS.email, country: "United Kingdom", createdAt: "2024-03-12T10:00:00.000Z" },
  { id: "usr-c1", firstName: "Sofia", lastName: "Ramírez", email: "sofia.r@example.com", country: "Spain", createdAt: "2025-01-04T10:00:00.000Z" },
  { id: "usr-c2", firstName: "Daniel", lastName: "Kim", email: "d.kim@example.com", country: "United States", createdAt: "2025-02-18T10:00:00.000Z" },
  { id: "usr-c3", firstName: "Priya", lastName: "Shah", email: "priya.shah@example.com", country: "India", createdAt: "2025-03-22T10:00:00.000Z" },
  { id: "usr-c4", firstName: "Lukas", lastName: "Brandt", email: "lukas.b@example.com", country: "Germany", createdAt: "2025-04-11T10:00:00.000Z" },
  { id: "usr-c5", firstName: "Amara", lastName: "Okafor", email: "amara.o@example.com", country: "Nigeria", createdAt: "2025-05-30T10:00:00.000Z" },
  { id: "usr-c6", firstName: "Chloé", lastName: "Dubois", email: "chloe.d@example.com", country: "France", createdAt: "2025-06-14T10:00:00.000Z" },
  { id: "usr-c7", firstName: "Yuki", lastName: "Nakamura", email: "yuki.n@example.com", country: "Japan", createdAt: "2025-08-01T10:00:00.000Z" },
  { id: "usr-c8", firstName: "Oliver", lastName: "Walsh", email: "o.walsh@example.com", country: "Australia", createdAt: "2025-09-19T10:00:00.000Z" },
  { id: "usr-c9", firstName: "Leila", lastName: "Haddad", email: "leila.h@example.com", country: "United Arab Emirates", createdAt: "2026-01-07T10:00:00.000Z" },
  { id: "usr-c10", firstName: "Erik", lastName: "Johansson", email: "erik.j@example.com", country: "Sweden", createdAt: "2026-02-25T10:00:00.000Z" },
];
