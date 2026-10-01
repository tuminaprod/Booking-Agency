"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimal persisted store built on useSyncExternalStore.
 * - Server render and hydration use `initial` (no hydration mismatches).
 * - After hydration React re-reads the client snapshot from localStorage.
 * - Storage access is wrapped: private mode / blocked storage degrades to memory.
 */
export interface Store<T> {
  get: () => T;
  set: (updater: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  use: <S>(selector: (state: T) => S) => S;
}

export function createStore<T>(key: string, initial: T, options: { persist?: boolean; version?: number } = {}): Store<T> {
  const persist = options.persist !== false;
  const storageKey = `oriel:${key}:v${options.version ?? 1}`;
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    if (!persist) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) state = { ...initial, ...JSON.parse(raw) } as T;
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  };

  const get = () => {
    load();
    return state;
  };

  const set: Store<T>["set"] = (updater) => {
    load();
    state = typeof updater === "function" ? (updater as (p: T) => T)(state) : updater;
    if (persist) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        /* ignore quota / privacy errors */
      }
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loaded = false;
        state = initial;
        load();
        listener();
      }
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  };

  function use<S>(selector: (s: T) => S): S {
    return useSyncExternalStore(subscribe, () => selector(get()), () => selector(initial));
  }

  return { get, set, subscribe, use };
}

/** True after hydration — for UI that must differ between server and client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
