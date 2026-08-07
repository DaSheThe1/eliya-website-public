"use client";

import { useEffect, useState } from "react";

import { useSiteMotionPreference } from "@foundation/accessibility";

import type { SiteContent } from "@/content";
import { useStoredState } from "@/lib/stored-state";

type Preferences = {
  textScale: number;
  contrast: boolean;
  spacing: boolean;
  links: boolean;
};

const STORAGE_KEY = "eliya.a11y.v1";
const SCALES = [100, 110, 125, 150];
const DEFAULTS: Preferences = {
  textScale: 100,
  contrast: false,
  spacing: false,
  links: false,
};

/**
 * The accessibility panel.
 *
 * Every switch writes a data attribute on <html> and the CSS does the rest, so
 * a preference is one declaration to honour rather than a prop threaded through
 * every component. Preferences persist in localStorage and are re-applied
 * before the panel is opened again.
 *
 * Motion is deliberately NOT a switch of its own here. The site already has one
 * stored motion choice, the same one the footer toggle writes, and two controls
 * that disagree about whether motion is on is worse than one control in a place
 * you did not expect. This panel drives that same store.
 */
export function AccessibilityPanel({ content }: { content: SiteContent }) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useStoredState<Preferences>(
    STORAGE_KEY,
    DEFAULTS,
    (raw) => ({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) }),
  );
  const { reduced, setReduced } = useSiteMotionPreference();
  const labels = content.accessibility;

  // Writing to <html> is updating an external system with the latest state,
  // which is what an effect is actually for.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yTextScale = String(preferences.textScale);
    root.dataset.a11yContrast = String(preferences.contrast);
    root.dataset.a11ySpacing = String(preferences.spacing);
    root.dataset.a11yLinks = String(preferences.links);
  }, [preferences]);

  const update = (patch: Partial<Preferences>) =>
    setPreferences({ ...preferences, ...patch });

  const scaleIndex = SCALES.indexOf(preferences.textScale);

  return (
    <div aria-label={labels.title} role="complementary">
      <button
        aria-expanded={open}
        aria-label={labels.launcherLabel}
        className="a11y-launcher"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden focusable="false" viewBox="0 0 24 24">
          <circle cx="12" cy="4" fill="currentColor" r="2" />
          <path
            d="M4 8h16M12 8v6m0 0-3 7m3-7 3 7"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {open ? (
        <div className="a11y-panel">
          <div className="a11y-panel__head">
            <p className="a11y-panel__title">{labels.title}</p>
            <button
              className="a11y-panel__close"
              onClick={() => setOpen(false)}
              type="button"
            >
              {labels.close}
            </button>
          </div>

          <div className="a11y-panel__row">
            <span>{labels.textSize}</span>
            <div className="a11y-panel__stepper">
              <button
                aria-label={labels.decrease}
                disabled={scaleIndex <= 0}
                onClick={() => update({ textScale: SCALES[scaleIndex - 1] })}
                type="button"
              >
                −
              </button>
              <span className="a11y-panel__value">{preferences.textScale}%</span>
              <button
                aria-label={labels.increase}
                disabled={scaleIndex >= SCALES.length - 1}
                onClick={() => update({ textScale: SCALES[scaleIndex + 1] })}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          {(
            [
              ["contrast", labels.contrast],
              ["spacing", labels.spacing],
              ["links", labels.links],
            ] as const
          ).map(([key, label]) => (
            <button
              aria-pressed={preferences[key]}
              className="a11y-panel__toggle"
              key={key}
              onClick={() => update({ [key]: !preferences[key] })}
              type="button"
            >
              <span>{label}</span>
              <span className="a11y-panel__state">
                {preferences[key] ? labels.on : labels.off}
              </span>
            </button>
          ))}

          <button
            aria-pressed={reduced}
            className="a11y-panel__toggle"
            onClick={() => setReduced(!reduced)}
            type="button"
          >
            <span>{labels.motion}</span>
            <span className="a11y-panel__state">
              {reduced ? labels.on : labels.off}
            </span>
          </button>

          <button
            className="a11y-panel__reset"
            onClick={() => {
              setPreferences(DEFAULTS);
              setReduced(false);
            }}
            type="button"
          >
            {labels.reset}
          </button>
        </div>
      ) : null}
    </div>
  );
}
