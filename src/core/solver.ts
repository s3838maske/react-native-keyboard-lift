import { MIN_SCROLL_DELTA } from './constants';
import type { Rect, ScrollBehavior } from '../types';

/** Everything needed to decide whether — and how far — to scroll. */
export interface SolveScrollInput {
  /** Frame of the scrollable container, in window coordinates. */
  containerRect: Rect;
  /** Frame of the focused input, in window coordinates. */
  inputRect: Rect;
  /** Height of the application window, in points. */
  windowHeight: number;
  /** Points of the window covered from the bottom edge (see `normalize.ts`). */
  occludedHeight: number;
  /** Current vertical scroll offset. */
  currentOffset: number;
  /** Total scrollable content height, or `null` if not yet measured. */
  contentHeight: number | null;
  /** Laid-out height of the scroll container, or `null` if not yet measured. */
  containerHeight: number | null;
  /** Gap to leave between the input and the keyboard. */
  extraSpace: number;
  /** Movement strategy. */
  behavior: ScrollBehavior;
}

/** Outcome of the scroll calculation. */
export interface SolveScrollResult {
  /** Whether a scroll is worth performing. */
  shouldScroll: boolean;
  /** Absolute offset to scroll to. */
  offset: number;
  /** Signed distance from the current offset. */
  delta: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isFinitePositive(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const NO_SCROLL = (offset: number): SolveScrollResult => ({
  shouldScroll: false,
  offset,
  delta: 0,
});

/**
 * Work out where the scroll view should sit so the focused input is visible.
 *
 * All arithmetic happens in window coordinates, which sidesteps the status
 * bar, notch and navigation bar entirely: we only ever compare two rectangles
 * that were measured the same way.
 *
 * The visible region is the intersection of the container's own frame with the
 * part of the window the keyboard does not cover. An input is left alone when
 * it already fits inside that region, which is what stops the view twitching
 * every time the keyboard reports a new frame.
 */
export function solveScroll(input: SolveScrollInput): SolveScrollResult {
  const {
    containerRect,
    inputRect,
    windowHeight,
    occludedHeight,
    currentOffset,
    contentHeight,
    containerHeight,
    extraSpace,
    behavior,
  } = input;

  if (
    !Number.isFinite(currentOffset) ||
    !Number.isFinite(inputRect.y) ||
    !Number.isFinite(inputRect.height) ||
    !Number.isFinite(containerRect.y) ||
    !Number.isFinite(containerRect.height)
  ) {
    return NO_SCROLL(currentOffset);
  }

  const keyboardTop = windowHeight - Math.max(0, occludedHeight);

  const visibleTop = containerRect.y;
  const visibleBottom = Math.min(containerRect.y + containerRect.height, keyboardTop);
  const visibleHeight = visibleBottom - visibleTop;

  // The keyboard covers the container completely; there is nothing to reveal.
  if (visibleHeight <= 0) {
    return NO_SCROLL(currentOffset);
  }

  const inputTop = inputRect.y;
  const inputBottom = inputRect.y + inputRect.height;

  const hiddenBelow = inputBottom + extraSpace - visibleBottom;
  const hiddenAbove = visibleTop - inputTop;

  // Already comfortably in view — do nothing. This is what keeps the common
  // case (tapping an input near the top of a form) completely still.
  if (hiddenBelow <= 0 && hiddenAbove <= 0) {
    return NO_SCROLL(currentOffset);
  }

  let delta: number;

  if (inputRect.height + extraSpace >= visibleHeight) {
    // Input is taller than the space available: we cannot satisfy both edges,
    // so align its top and let the user scroll to the rest.
    delta = inputTop - visibleTop;
  } else if (behavior === 'center') {
    const inputCenter = inputTop + inputRect.height / 2;
    const visibleCenter = visibleTop + visibleHeight / 2;
    delta = inputCenter - visibleCenter;
  } else if (hiddenBelow > 0) {
    delta = hiddenBelow;
  } else {
    delta = -hiddenAbove;
  }

  const maxOffset =
    isFinitePositive(contentHeight) && isFinitePositive(containerHeight)
      ? Math.max(0, contentHeight - containerHeight)
      : Number.POSITIVE_INFINITY;

  const offset = clamp(currentOffset + delta, 0, maxOffset);
  const appliedDelta = offset - currentOffset;

  if (Math.abs(appliedDelta) < MIN_SCROLL_DELTA) {
    return NO_SCROLL(currentOffset);
  }

  return { shouldScroll: true, offset, delta: appliedDelta };
}
