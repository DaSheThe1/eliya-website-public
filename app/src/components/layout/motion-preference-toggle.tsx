"use client";

import { useSiteMotionPreference } from "@foundation/accessibility";

interface MotionPreferenceToggleProps {
  reduceLabel: string;
  restoreLabel: string;
}

export function MotionPreferenceToggle({
  reduceLabel,
  restoreLabel,
}: MotionPreferenceToggleProps) {
  const { reduced, setReduced } = useSiteMotionPreference();

  return (
    <button
      aria-pressed={reduced}
      className="motion-preference-toggle"
      onClick={() => setReduced(!reduced)}
      type="button"
    >
      {reduced ? restoreLabel : reduceLabel}
    </button>
  );
}
