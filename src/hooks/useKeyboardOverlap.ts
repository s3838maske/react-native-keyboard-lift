import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { asMeasurable, measureInWindow } from '../core/measure';
import type { KeyboardMetrics } from '../types';
import { useKeyboardMetrics } from './useKeyboard';

/** Options for {@link useKeyboardOverlap}. */
export interface UseKeyboardOverlapOptions {
  enabled: boolean;
  extraSpace: number;
  consumedOffset: number;
  bottomInset?: number;
}

/** Result of {@link useKeyboardOverlap}. */
export interface UseKeyboardOverlapResult {
  /** How many points of *this view* the keyboard actually covers. */
  overlap: number;
  metrics: KeyboardMetrics;
  setViewRef: (node: View | null) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Measure how much of a specific view the keyboard covers.
 *
 * This is the key difference from React Native's `KeyboardAvoidingView`, which
 * applies the entire keyboard height regardless of where the view actually
 * sits. A view that already ends above the keyboard — because a tab bar or
 * another sibling occupies the space below it — needs no adjustment at all,
 * and this returns `0` for it. That is why no `keyboardVerticalOffset`
 * guesswork is needed.
 */
export function useKeyboardOverlap(
  options: UseKeyboardOverlapOptions,
): UseKeyboardOverlapResult {
  const { enabled, extraSpace, consumedOffset, bottomInset } = options;

  const metrics = useKeyboardMetrics({ bottomInset });
  const { height: windowHeight } = useWindowDimensions();

  const viewRef = useRef<View | null>(null);
  /**
   * Where the view's bottom edge sits with no keyboard applied. Captured while
   * the keyboard is hidden, so that applying an offset can never feed back
   * into the measurement it was derived from.
   */
  const restingBottomRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  const [overlap, setOverlap] = useState(0);

  const setViewRef = useCallback((node: View | null): void => {
    viewRef.current = node;
  }, []);

  const measureResting = useCallback(async (): Promise<void> => {
    const runId = ++runIdRef.current;
    const rect = await measureInWindow(asMeasurable(viewRef.current));
    if (runId !== runIdRef.current || !rect) {
      return;
    }
    restingBottomRef.current = rect.y + rect.height;
  }, []);

  const onLayout = useCallback(
    (_event: LayoutChangeEvent): void => {
      // Only trust a fresh measurement while nothing is displaced.
      if (!metrics.isVisible) {
        void measureResting();
      }
    },
    [metrics.isVisible, measureResting],
  );

  useEffect(() => {
    if (!enabled || !metrics.isVisible) {
      setOverlap(0);
      return;
    }

    let cancelled = false;

    const compute = async (): Promise<void> => {
      if (restingBottomRef.current == null) {
        await measureResting();
      }
      const restingBottom = restingBottomRef.current;
      if (cancelled || restingBottom == null) {
        return;
      }

      const keyboardTop = windowHeight - metrics.occludedHeight;
      const raw = restingBottom + extraSpace - keyboardTop - consumedOffset;
      setOverlap(Math.max(0, raw));
    };

    void compute();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    metrics.isVisible,
    metrics.occludedHeight,
    windowHeight,
    extraSpace,
    consumedOffset,
    measureResting,
  ]);

  // Discard any in-flight measurement on unmount.
  useEffect(() => () => {
    runIdRef.current += 1;
  }, []);

  return { overlap, metrics, setViewRef, onLayout };
}
