"use client";

import { useEffect, useRef } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

/**
 * motion-cursor-surface.
 *
 * A decorative gold wash that follows a real pointer. Purely ornamental and
 * `aria-hidden`; it never carries meaning. The contract:
 *
 * - Requires an actual fine pointer. On touch — which is most of this site's
 *   traffic, since it comes from Instagram — it never mounts a listener.
 * - Stops at rest. After a short idle it fades out rather than sitting lit.
 * - Honours the site's stored motion opt-out, and pauses when the tab is
 *   hidden so a backgrounded page does no work.
 * - Position is written to a CSS custom property inside a rAF, so pointer
 *   events never trigger a React render.
 */
export function CursorSurface() {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useSiteMotionPreference();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    function onMove(event: PointerEvent) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!node) return;
        node.style.setProperty("--cursor-x", `${event.clientX}px`);
        node.style.setProperty("--cursor-y", `${event.clientY}px`);
        node.dataset.active = "true";
      });

      if (idle) clearTimeout(idle);
      idle = setTimeout(() => {
        if (node) node.dataset.active = "false";
      }, 900);
    }

    function onHidden() {
      if (document.hidden && node) node.dataset.active = "false";
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onHidden);
      if (frame) cancelAnimationFrame(frame);
      if (idle) clearTimeout(idle);
    };
  }, [reduced]);

  return <div aria-hidden="true" className="cursor-surface" data-active="false" ref={ref} />;
}
