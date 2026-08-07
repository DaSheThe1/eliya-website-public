export const SITE_MOTION_STORAGE_KEY = "site-motion-preference";
export const SITE_MOTION_STORAGE_VERSION = 1;
export const SITE_MOTION_EVENT = "site-motion-preference-change";

export type SiteMotionPreference = "motion" | "reduced";

type StoredSiteMotionPreference = {
  version: typeof SITE_MOTION_STORAGE_VERSION;
  reduced: boolean;
};

export function parseStoredSiteMotionPreference(
  value: unknown,
): SiteMotionPreference | null {
  if (!value || typeof value !== "object") return null;
  const stored = value as Partial<StoredSiteMotionPreference>;
  if (
    stored.version !== SITE_MOTION_STORAGE_VERSION ||
    typeof stored.reduced !== "boolean"
  ) {
    return null;
  }
  return stored.reduced ? "reduced" : "motion";
}

export function readSiteMotionPreference(): SiteMotionPreference {
  if (typeof document === "undefined") return "motion";
  return document.documentElement.dataset.siteMotion === "reduced"
    ? "reduced"
    : "motion";
}

export function writeSiteMotionPreference(reduced: boolean): void {
  if (typeof window === "undefined") return;

  const preference: SiteMotionPreference = reduced ? "reduced" : "motion";
  document.documentElement.dataset.siteMotion = preference;
  try {
    const stored: StoredSiteMotionPreference = {
      version: SITE_MOTION_STORAGE_VERSION,
      reduced,
    };
    window.localStorage.setItem(
      SITE_MOTION_STORAGE_KEY,
      JSON.stringify(stored),
    );
  } catch {
    // The preference remains effective for this visit when storage is blocked.
  }
  window.dispatchEvent(new Event(SITE_MOTION_EVENT));
}

/**
 * Apply the stored site choice before first paint.
 *
 * Motion is on by default. The device's `prefers-reduced-motion` signal is
 * deliberately not read or used as a seed. Generated sites expose their own
 * stored control when motion is selected in the reviewed brief.
 */
export const SITE_MOTION_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,p="motion";try{var r=window.localStorage.getItem(${JSON.stringify(
  SITE_MOTION_STORAGE_KEY,
)}),v=r?JSON.parse(r):null;if(v&&v.version===${SITE_MOTION_STORAGE_VERSION}&&typeof v.reduced==="boolean"){p=v.reduced?"reduced":"motion"}}catch(e){}d.dataset.siteMotion=p}catch(e){}})();`;
