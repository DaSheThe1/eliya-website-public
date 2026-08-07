"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A React binding for a single localStorage key.
 *
 * Reading storage in an effect and calling setState is the obvious way to do
 * this and it is wrong twice: it renders once with the default and again with
 * the stored value, and React 19 flags the cascading render. `useSyncExternalStore`
 * is the API built for exactly this shape — an external store, a snapshot, and
 * a server snapshot for the render that has no storage at all.
 *
 * The snapshot must be REFERENTIALLY STABLE or React re-renders forever, so
 * parsed values are cached per key and only replaced when the raw string
 * actually changes.
 */
const rawCache = new Map<string, string | null>();
const valueCache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage blocked (private mode, embedded webview). Behaving as if nothing
    // was stored is the honest answer; it must not throw during render.
    return null;
  }
}

function subscribe(key: string, onChange: () => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(onChange);
  listeners.set(key, set);

  // Another tab writing the same key should move this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      rawCache.delete(key);
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function useStoredState<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
): [T, (value: T) => void] {
  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key);
    if (rawCache.get(key) === raw && valueCache.has(key)) {
      return valueCache.get(key) as T;
    }
    rawCache.set(key, raw);
    let value = fallback;
    if (raw !== null) {
      try {
        value = parse(raw);
      } catch {
        // A corrupt value must not take the page down with it.
        value = fallback;
      }
    }
    valueCache.set(key, value);
    return value;
  }, [fallback, key, parse]);

  // The server has no storage, so it always renders the fallback. The stored
  // value arrives on hydration without a second render pass of our own.
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(key, onChange), [key]),
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Nothing to persist to; the value still applies to this page view.
      }
      rawCache.delete(key);
      valueCache.set(key, next);
      notify(key);
    },
    [key],
  );

  return [value, setValue];
}
