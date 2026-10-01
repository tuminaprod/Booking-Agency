"use client";

import type { Booking, CurrencyCode, ID, LanguageCode, SavableType, WishlistCollection, WishlistItem } from "@/lib/models";
import { createStore } from "./create-store";

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

export const preferencesStore = createStore<{ currency: CurrencyCode; language: LanguageCode }>("prefs", {
  currency: "USD",
  language: "en",
});

export const useCurrency = () => preferencesStore.use((s) => s.currency);

/* ------------------------------------------------------------------ */
/* Wishlist                                                            */
/* ------------------------------------------------------------------ */

/** Display snapshot stored with each saved item so the wishlist renders without refetching. */
export interface SavedSnapshot {
  title: string;
  subtitle: string;
  href: string;
  image: { src: string; alt: string };
  priceFrom?: number;
  priceUnit?: string;
  rating?: number;
  reviewCount?: number;
  stars?: number;
  /** Hotel comparison fields */
  compare?: {
    propertyType: string;
    neighborhood: string;
    amenities: string[];
    cancellation?: string;
    breakfast?: boolean;
    distanceKm?: number;
  };
}

export interface SavedItem extends WishlistItem {
  snapshot: SavedSnapshot;
}

interface WishlistState {
  items: SavedItem[];
  collections: WishlistCollection[];
  compare: ID[];
}

export const wishlistStore = createStore<WishlistState>("wishlist", { items: [], collections: [], compare: [] });

export const wishlist = {
  isSaved: (type: SavableType, entityId: ID) => wishlistStore.get().items.some((i) => i.type === type && i.entityId === entityId),
  toggle(type: SavableType, entityId: ID, snapshot: SavedSnapshot): boolean {
    const saved = wishlist.isSaved(type, entityId);
    wishlistStore.set((s) =>
      saved
        ? { ...s, items: s.items.filter((i) => !(i.type === type && i.entityId === entityId)), compare: s.compare.filter((c) => c !== entityId) }
        : { ...s, items: [{ id: `wl_${type}_${entityId}`, type, entityId, addedAt: new Date().toISOString(), collectionIds: [], snapshot }, ...s.items] },
    );
    return !saved;
  },
  remove(itemId: ID) {
    wishlistStore.set((s) => {
      const item = s.items.find((i) => i.id === itemId);
      return { ...s, items: s.items.filter((i) => i.id !== itemId), compare: s.compare.filter((c) => c !== item?.entityId) };
    });
  },
  restore(item: SavedItem) {
    wishlistStore.set((s) => (s.items.some((i) => i.id === item.id) ? s : { ...s, items: [item, ...s.items] }));
  },
  createCollection(name: string): WishlistCollection {
    const c = { id: `col_${Date.now().toString(36)}`, name: name.trim().slice(0, 60), createdAt: new Date().toISOString() };
    wishlistStore.set((s) => ({ ...s, collections: [...s.collections, c] }));
    return c;
  },
  renameCollection(id: ID, name: string) {
    wishlistStore.set((s) => ({ ...s, collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)) }));
  },
  deleteCollection(id: ID) {
    wishlistStore.set((s) => ({
      ...s,
      collections: s.collections.filter((c) => c.id !== id),
      items: s.items.map((i) => ({ ...i, collectionIds: i.collectionIds.filter((x) => x !== id) })),
    }));
  },
  toggleInCollection(itemId: ID, collectionId: ID) {
    wishlistStore.set((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.id !== itemId
          ? i
          : { ...i, collectionIds: i.collectionIds.includes(collectionId) ? i.collectionIds.filter((c) => c !== collectionId) : [...i.collectionIds, collectionId] },
      ),
    }));
  },
  toggleCompare(entityId: ID): { ok: boolean; reason?: string } {
    const { compare } = wishlistStore.get();
    if (compare.includes(entityId)) {
      wishlistStore.set((s) => ({ ...s, compare: s.compare.filter((c) => c !== entityId) }));
      return { ok: true };
    }
    if (compare.length >= 4) return { ok: false, reason: "You can compare up to 4 hotels at a time." };
    wishlistStore.set((s) => ({ ...s, compare: [...s.compare, entityId] }));
    return { ok: true };
  },
  clearCompare() {
    wishlistStore.set((s) => ({ ...s, compare: [] }));
  },
};

/* ------------------------------------------------------------------ */
/* Recently viewed                                                     */
/* ------------------------------------------------------------------ */

export interface RecentItem {
  key: string;
  type: SavableType;
  entityId: ID;
  snapshot: SavedSnapshot;
  viewedAt: string;
}

export const recentStore = createStore<{ items: RecentItem[] }>("recent", { items: [] });

export function trackRecentlyViewed(type: SavableType, entityId: ID, snapshot: SavedSnapshot) {
  const key = `${type}:${entityId}`;
  recentStore.set((s) => ({
    items: [{ key, type, entityId, snapshot, viewedAt: new Date().toISOString() }, ...s.items.filter((i) => i.key !== key)].slice(0, 12),
  }));
}

/* ------------------------------------------------------------------ */
/* Search history                                                      */
/* ------------------------------------------------------------------ */

export interface RecentSearch {
  id: string;
  label: string;
  detail: string;
  href: string;
  kind: "hotels" | "trips" | "experiences" | "query";
  at: string;
}

export const searchHistoryStore = createStore<{ items: RecentSearch[] }>("search-history", { items: [] });

export function pushSearchHistory(entry: Omit<RecentSearch, "id" | "at">) {
  searchHistoryStore.set((s) => ({
    items: [{ ...entry, id: `${entry.kind}:${entry.href}`, at: new Date().toISOString() }, ...s.items.filter((i) => i.href !== entry.href)].slice(0, 8),
  }));
}

export const clearSearchHistory = () => searchHistoryStore.set({ items: [] });
export const removeSearchHistory = (id: string) => searchHistoryStore.set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

/* ------------------------------------------------------------------ */
/* Bookings made in this browser                                       */
/* ------------------------------------------------------------------ */

export const bookingsStore = createStore<{ items: Booking[]; overrides: Record<string, Partial<Booking>> }>("bookings", { items: [], overrides: {} });

export function saveBooking(b: Booking) {
  bookingsStore.set((s) => ({ ...s, items: [b, ...s.items.filter((x) => x.reference !== b.reference)] }));
}

/** Records a status change (e.g. cancellation) for any booking, including seeded ones. */
export function updateBooking(reference: string, patch: Partial<Booking>) {
  bookingsStore.set((s) => ({
    items: s.items.map((b) => (b.reference === reference ? { ...b, ...patch } : b)),
    overrides: { ...s.overrides, [reference]: { ...s.overrides[reference], ...patch } },
  }));
}
