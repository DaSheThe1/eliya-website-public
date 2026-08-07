"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

export interface ScrollStation {
  id: string;
  content: ReactNode;
}

interface NativeScrollStoryProps {
  stations: ScrollStation[];
  label: string;
}

/**
 * motion-native-scroll-story.
 *
 * A scroll-driven sequence built on the browser's own scrolling. The contract:
 *
 * - Native scroll only. No wheel or touch interception, no body lock, no root
 *   scroll-snap. Scrolling always does what the visitor expects and a flick
 *   still flings.
 * - Stable server geometry: every station is in the markup at its final size,
 *   so nothing reflows as the story advances and there is no layout shift.
 * - Without JavaScript, without the observer, or with motion opted out, every
 *   station is simply present at full volume.
 *
 * ── ⚠️ IT LIGHTS, IT NEVER DIMS. THIS RULE WAS LEARNED THE HARD WAY. ──
 * The first cut tracked ONE active station and faded the rest to 55%. Daniel,
 * looking at the four headline numbers: *"only the first one is glowing. The
 * others don't work at all."* He was right, and the bug was the design: three
 * dimmed tiles beside one bright one do not read as a sequence, they read as
 * three broken tiles.
 *
 * So lighting is CUMULATIVE and ONE-WAY. Every station is fully legible at
 * rest; arriving adds a warm lift, and a station that has been reached stays
 * reached. Nothing is ever taken away from a reader who scrolls back up, and no
 * station is ever dimmed to make another look brighter.
 *
 * Interim content: Eliya has not produced dedicated scroll-story media yet, so
 * this currently carries her headline numbers. The Pnina implementation is the
 * behavioural reference only; none of her art, copy, palette, timings or media
 * files appear here.
 */
export function NativeScrollStory({ stations, label }: NativeScrollStoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useSiteMotionPreference();
  const [reached, setReached] = useState<Set<string>>(new Set());

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        setReached((current) => {
          let next = current;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = (entry.target as HTMLElement).dataset.stationId;
            if (!id || current.has(id)) continue;
            if (next === current) next = new Set(current);
            next.add(id);
          }
          return next;
        });
      },
      // Deliberately not a scroll handler: this settles after the browser has
      // finished, so it never fights momentum scrolling.
      { rootMargin: "0px 0px -18% 0px", threshold: 0.4 },
    );

    node
      .querySelectorAll<HTMLElement>("[data-station-id]")
      .forEach((station) => observer.observe(station));
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div aria-label={label} className="scroll-story" ref={ref}>
      {stations.map((station) => (
        <div
          className="scroll-story__station"
          data-lit={!reduced && reached.has(station.id) ? "true" : "false"}
          data-station-id={station.id}
          key={station.id}
        >
          {station.content}
        </div>
      ))}
    </div>
  );
}
