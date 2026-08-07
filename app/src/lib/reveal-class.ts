/**
 * The `Reveal` component from @foundation/accessibility always renders a div.
 * Where the correct element is an li, figure or dd, apply its classes directly
 * instead of wrapping the semantics in a div.
 */
export function revealClass(delay = 0, className?: string): string {
  return [
    "a11y-reveal",
    `a11y-reveal--delay-${Math.min(Math.max(delay, 0), 4)}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
