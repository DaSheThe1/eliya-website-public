"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

interface OneShotCtaProps {
  children: ReactNode;
  className?: string;
}

/**
 * motion-one-shot-cta.
 *
 * A single emphasis pass over the call to action, then nothing. The contract:
 *
 * - The base state is the finished state. Without JavaScript, without the
 *   observer, or with motion opted out, the CTA is simply there and styled.
 * - It plays once per entry. It re-arms only after the element has fully left
 *   the viewport, so scrolling back up cannot make it flash repeatedly.
 * - It never loops. A CTA that pulses forever is pressure, not emphasis.
 */
export function OneShotCta({ children, className }: OneShotCtaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useSiteMotionPreference();
  const [state, setState] = useState<"idle" | "played">("idle");
  const armedRef = useRef(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && armedRef.current) {
          armedRef.current = false;
          setState("played");
          return;
        }
        // Full exit re-arms; a partial scroll does not.
        if (!entry.isIntersecting && entry.intersectionRatio === 0) {
          armedRef.current = true;
          setState("idle");
        }
      },
      { threshold: [0, 0.55] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div className={className} data-cta-emphasis={state} ref={ref}>
      {children}
    </div>
  );
}
