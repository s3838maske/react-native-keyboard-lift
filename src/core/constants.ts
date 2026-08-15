/**
 * Fallback animation duration, in milliseconds.
 *
 * Android keyboard events carry no duration (there is no platform primitive
 * that provides one), and iOS occasionally reports `0` — for example when a
 * hardware keyboard is attached. Roughly matches the stock Android IME
 * transition.
 */
export const DEFAULT_ANIMATION_DURATION = 250;

/** Durations below this are treated as "no animation" and clamped up. */
export const MIN_ANIMATION_DURATION = 10;

/**
 * Tolerance, in points, for deciding whether an iOS keyboard is docked to the
 * bottom of the window. Undocked and floating iPad keyboards are deliberately
 * ignored, matching the behaviour of UIKit's `keyboardLayoutGuide`.
 */
export const DOCK_TOLERANCE = 2;

/** Default gap left between the focused input and the top of the keyboard. */
export const DEFAULT_EXTRA_SPACE = 12;

/**
 * How often to check whether focus moved to a different input while the
 * keyboard is already open.
 *
 * React Native emits no event for this, and on Android API 30+ not even a
 * keyboard event fires (`ReactRootView` only reports visibility *changes*).
 * The check is a single JavaScript property read with no bridge traffic, and
 * only runs while the keyboard is visible.
 */
export const FOCUS_POLL_INTERVAL_MS = 150;

/**
 * Scroll adjustments smaller than this are skipped, to avoid visible jitter
 * from sub-point measurement noise.
 */
export const MIN_SCROLL_DELTA = 1;
