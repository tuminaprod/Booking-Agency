"use client";

import { useEffect, useState } from "react";
import type { SuggestEntry } from "./suggest";

let promise: Promise<SuggestEntry[]> | null = null;
let cached: SuggestEntry[] | null = null;

export function loadSuggestIndex(): Promise<SuggestEntry[]> {
  if (cached) return Promise.resolve(cached);
  if (!promise) {
    promise = fetch("/api/search/index")
      .then((r) => {
        if (!r.ok) throw new Error(`Index request failed (${r.status})`);
        return r.json() as Promise<{ entries: SuggestEntry[] }>;
      })
      .then((d) => (cached = d.entries))
      .catch((e) => {
        promise = null; // allow retry
        throw e;
      });
  }
  return promise;
}

/** Loads the autocomplete index lazily (on first focus) and caches it for the session. */
export function useSuggestIndex(enabled: boolean) {
  const [index, setIndex] = useState<SuggestEntry[] | null>(cached);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled || index) return;
    let alive = true;
    loadSuggestIndex()
      .then((d) => alive && setIndex(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [enabled, index]);
  return { index, error, retry: () => setError(false) };
}
