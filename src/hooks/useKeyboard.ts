import { useMemo, useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';

import { useBottomInset } from '../core/insets';
import { normalizeKeyboardEvent } from '../core/normalize';
import { PLATFORM } from '../core/platform';
import { keyboardStore } from '../core/store';
import type { KeyboardMetrics, UseKeyboardResult } from '../types';

/** Options accepted by {@link useKeyboard}. */
export interface UseKeyboardOptions {
  /**
   * Override the automatically resolved bottom safe-area inset. Rarely needed;
   * see `core/insets.ts` for how it is otherwise determined.
   */
  bottomInset?: number;
}

/**
 * Normalised keyboard geometry, without the convenience aliases.
 *
 * Used internally by the components, which have no need for the duplicated
 * field names.
 */
export function useKeyboardMetrics(options?: UseKeyboardOptions): KeyboardMetrics {
  const raw = useSyncExternalStore(
    keyboardStore.subscribe,
    keyboardStore.getSnapshot,
    keyboardStore.getSnapshot,
  );
  const { height: windowHeight } = useWindowDimensions();
  const bottomInset = useBottomInset(options?.bottomInset);

  return useMemo(
    () =>
      normalizeKeyboardEvent(raw.event, raw.isVisible, {
        platform: PLATFORM,
        windowHeight,
        bottomInset,
      }),
    [raw, windowHeight, bottomInset],
  );
}

/**
 * Subscribe to the software keyboard.
 *
 * Unlike listening to `Keyboard` directly, the values reported here mean the
 * same thing on both platforms: `keyboardHeight` is always the keyboard alone,
 * and `occludedHeight` is always how much of the window is covered — including
 * the Android navigation bar the keyboard is drawn over.
 *
 * ```tsx
 * const { isKeyboardVisible, keyboardHeight } = useKeyboard();
 * ```
 *
 * Every consumer shares a single pair of native listeners, so this is cheap to
 * call from many components.
 */
export function useKeyboard(options?: UseKeyboardOptions): UseKeyboardResult {
  const metrics = useKeyboardMetrics(options);

  return useMemo(
    () => ({
      ...metrics,
      isKeyboardVisible: metrics.isVisible,
      keyboardHeight: metrics.height,
      keyboardAnimationDuration: metrics.duration,
      keyboardAnimationEasing: metrics.easing,
    }),
    [metrics],
  );
}
