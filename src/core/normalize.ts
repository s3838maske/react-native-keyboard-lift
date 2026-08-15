import type { KeyboardEvent } from 'react-native';

import {
  DEFAULT_ANIMATION_DURATION,
  DOCK_TOLERANCE,
  MIN_ANIMATION_DURATION,
} from './constants';
import type { KeyboardEasing, KeyboardMetrics } from '../types';

/** Everything `normalizeKeyboardEvent` needs to know about its surroundings. */
export interface NormalizeContext {
  platform: 'ios' | 'android' | 'other';
  /** Height of the application window, in points. */
  windowHeight: number;
  /** Bottom safe-area inset (navigation bar / home indicator), in points. */
  bottomInset: number;
}

const KNOWN_EASINGS: readonly KeyboardEasing[] = [
  'easeIn',
  'easeInEaseOut',
  'easeOut',
  'linear',
  'keyboard',
];

/** Metrics describing a fully hidden keyboard. */
export const HIDDEN_METRICS: KeyboardMetrics = {
  isVisible: false,
  height: 0,
  occludedHeight: 0,
  duration: DEFAULT_ANIMATION_DURATION,
  easing: 'keyboard',
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function resolveDuration(event: KeyboardEvent | null | undefined): number {
  const raw = event?.duration;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < MIN_ANIMATION_DURATION) {
    // Android never supplies one; iOS reports 0 for hardware-keyboard toggles.
    return DEFAULT_ANIMATION_DURATION;
  }
  return raw;
}

function resolveEasing(event: KeyboardEvent | null | undefined): KeyboardEasing {
  const raw = event?.easing;
  return KNOWN_EASINGS.includes(raw as KeyboardEasing)
    ? (raw as KeyboardEasing)
    : 'keyboard';
}

/**
 * Convert a raw React Native keyboard event into platform-independent
 * geometry.
 *
 * The two platforms disagree about what their own numbers mean, so each is
 * handled separately rather than papered over:
 *
 * **iOS** reports `endCoordinates.screenY` as the true top edge of the
 * keyboard, and `height` as its full height including the area over the home
 * indicator. We derive occlusion from `screenY`, because that stays correct
 * while the keyboard is mid-animation or partially off-screen.
 *
 * **Android** reports `height` with the system bars *already subtracted*
 * (`imeInsets.bottom - barInsets.bottom`), and `screenY` as the bottom of the
 * visible frame rather than the top of the keyboard. Under edge-to-edge —
 * mandatory from Android 15 — the window is not resized, so the navigation bar
 * inset must be added back to learn how much of the window is actually
 * covered. Skipping this is the single most common cause of an input sitting
 * ~24–48pt too low behind the keyboard.
 */
export function normalizeKeyboardEvent(
  event: KeyboardEvent | null | undefined,
  isVisible: boolean,
  context: NormalizeContext,
): KeyboardMetrics {
  const duration = resolveDuration(event);
  const easing = resolveEasing(event);

  if (!isVisible || !event?.endCoordinates) {
    return { ...HIDDEN_METRICS, duration, easing };
  }

  const { windowHeight, bottomInset, platform } = context;
  const safeWindowHeight = Number.isFinite(windowHeight) && windowHeight > 0 ? windowHeight : 0;
  const safeBottomInset = Number.isFinite(bottomInset) && bottomInset > 0 ? bottomInset : 0;

  const rawHeight = Number.isFinite(event.endCoordinates.height)
    ? event.endCoordinates.height
    : 0;

  let occludedHeight: number;
  let height: number;

  if (platform === 'ios') {
    const screenY = event.endCoordinates.screenY;

    if (!Number.isFinite(screenY) || safeWindowHeight === 0) {
      // Fall back to the reported height if we cannot trust the geometry.
      occludedHeight = Math.max(0, rawHeight);
      height = Math.max(0, occludedHeight - safeBottomInset);
    } else {
      const keyboardBottom = screenY + rawHeight;
      // Docked means the keyboard reaches the bottom of the window *or
      // extends past it*. The second case matters during interactive
      // dismissal, when the keyboard is dragged below the screen edge and
      // still very much occludes content on its way out.
      const isDocked = keyboardBottom >= safeWindowHeight - DOCK_TOLERANCE;

      // An undocked or floating iPad keyboard can be dragged anywhere and is
      // conventionally not avoided — UIKit's own keyboardLayoutGuide ignores
      // it too. Treating it as zero occlusion prevents wild over-scrolling.
      occludedHeight = isDocked ? clamp(safeWindowHeight - screenY, 0, safeWindowHeight) : 0;
      height = Math.max(0, occludedHeight - safeBottomInset);
    }
  } else {
    // Android (and any other platform routed through the Android contract).
    height = Math.max(0, rawHeight);
    occludedHeight = height > 0 ? height + safeBottomInset : 0;
  }

  if (occludedHeight <= 0) {
    return { ...HIDDEN_METRICS, duration, easing };
  }

  return { isVisible: true, height, occludedHeight, duration, easing };
}
