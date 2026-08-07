"use client";

import { useSiteMotionPreference } from "./use-site-motion-preference";

/**
 * Compatibility name for the single site-owned motion decision.
 *
 * Motion is on by default. This hook reads only the in-site stored opt-out and
 * deliberately does not consult `window.matchMedia("prefers-reduced-motion")`.
 */
export function usePrefersReducedMotion(): boolean {
  return useSiteMotionPreference().reduced;
}
