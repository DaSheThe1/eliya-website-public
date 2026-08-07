"use client";

import { useCallback, useSyncExternalStore } from "react";

type SaveDataConnection = EventTarget & { saveData?: boolean };

function connection(): SaveDataConnection | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: SaveDataConnection })
    .connection;
}

/**
 * Whether this visitor's connection is happy for us to spend bytes on media.
 *
 * The Save-Data header is an external store with a change event, so this is
 * `useSyncExternalStore` rather than an effect that calls setState: the effect
 * form renders once with the wrong answer and again with the right one, and
 * React 19 flags the cascading render.
 *
 * The SERVER SNAPSHOT IS `false`, deliberately. It means the server never emits
 * a media source, so "zero video requests under Save-Data" is a real guarantee
 * rather than a race against the browser's preload scanner. Everyone else gets
 * the source attached on hydration, a moment later.
 */
export function useAllowsMediaBytes(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const target = connection();
    /*
     * ⚠️ `navigator.connection` EXISTING DOES NOT MEAN IT IS AN EventTarget.
     *
     * The optional chain here was `target?.addEventListener(...)`, which only
     * guards against the property being absent — and on any engine or shim
     * where `connection` is a plain object of values, `addEventListener` is
     * undefined and this threw `target?.addEventListener is not a function`
     * during subscribe. That happens inside render, so it took down the whole
     * hero: with Save-Data simulated, `.hero-video` rendered ZERO nodes and the
     * clip, the poster and the play control all went with it.
     *
     * This is a pre-existing defect rather than a new one — it reproduces on
     * the source as it stood before this session's work, and the
     * `motion-hero-media` Save-Data spec has been failing on it. The feature
     * detection is now on the METHOD, not on the object.
     */
    if (typeof target?.addEventListener !== "function") return () => undefined;
    target.addEventListener("change", onChange);
    return () => target.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => connection()?.saveData !== true,
    () => false,
  );
}
