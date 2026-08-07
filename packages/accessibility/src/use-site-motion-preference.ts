"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  readSiteMotionPreference,
  SITE_MOTION_EVENT,
  SITE_MOTION_STORAGE_KEY,
  writeSiteMotionPreference,
} from "./site-motion-preference";

function subscribe(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SITE_MOTION_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener(SITE_MOTION_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SITE_MOTION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => "motion" as const;

export function useSiteMotionPreference() {
  const preference = useSyncExternalStore(
    subscribe,
    readSiteMotionPreference,
    getServerSnapshot,
  );
  const setReduced = useCallback((reduced: boolean) => {
    writeSiteMotionPreference(reduced);
  }, []);

  return {
    preference,
    reduced: preference === "reduced",
    setReduced,
  } as const;
}
