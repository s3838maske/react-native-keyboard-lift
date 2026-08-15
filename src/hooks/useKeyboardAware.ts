import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { DEFAULT_EXTRA_SPACE, FOCUS_POLL_INTERVAL_MS } from '../core/constants';
import {
  getFocusedInput,
  getNodeTag,
  warnIfFocusDetectionUnavailable,
} from '../core/focus';
import { measureInWindow } from '../core/measure';
import { solveScroll } from '../core/solver';
import { warnOnce } from '../core/warn';
import type {
  KeyboardAwareProps,
  KeyboardMetrics,
  MeasurableNode,
  ScrollReason,
} from '../types';
import { useKeyboardMetrics } from './useKeyboard';

/** Wiring supplied by whichever scrollable container is using the hook. */
export interface UseKeyboardAwareOptions extends KeyboardAwareProps {
  /** Host node of the scroll container, used for measurement. */
  getContainerNode: () => MeasurableNode | null;
  /** Move the container to an absolute vertical offset. */
  scrollToOffset: (offset: number, animated: boolean) => void;
}

/** Handlers the container must spread onto the underlying scrollable. */
export interface UseKeyboardAwareResult {
  metrics: KeyboardMetrics;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleLayout: (event: LayoutChangeEvent) => void;
  handleContentSizeChange: (width: number, height: number) => void;
}

/**
 * Keeps the focused input visible inside a scrollable container.
 *
 * Deliberately re-renders as little as possible: scroll offset, content size
 * and container size all live in refs, because none of them should cause a
 * render on their own. The only state that flows through React is the
 * normalised keyboard geometry.
 */
export function useKeyboardAware(
  options: UseKeyboardAwareOptions,
): UseKeyboardAwareResult {
  const {
    enabled = true,
    extraSpace,
    extraScrollHeight,
    scrollBehavior = 'minimal',
    resetScrollOnHide = false,
    bottomInset,
    trackFocusChanges = true,
    onKeyboardChange,
    onScrollToInput,
    getContainerNode,
    scrollToOffset,
  } = options;

  const metrics = useKeyboardMetrics({ bottomInset });
  const { height: windowHeight } = useWindowDimensions();

  const offsetRef = useRef(0);
  const contentHeightRef = useRef<number | null>(null);
  const containerHeightRef = useRef<number | null>(null);
  const lastFocusedRef = useRef<MeasurableNode | null>(null);
  const offsetBeforeKeyboardRef = useRef(0);
  const wasVisibleRef = useRef(false);

  /**
   * Incremented for every scroll attempt. Measurement is asynchronous, so a
   * run started for one input can resolve after focus has already moved to
   * another; comparing ids on resume discards the stale one. Also bumped on
   * unmount, which is what stops a late callback touching a dead component.
   */
  const runIdRef = useRef(0);

  // Mutable mirrors so that `performScroll` can stay referentially stable.
  const latest = useRef({
    enabled,
    scrollBehavior,
    windowHeight,
    metrics,
    onScrollToInput,
    getContainerNode,
    scrollToOffset,
    extraSpace: extraSpace ?? extraScrollHeight ?? DEFAULT_EXTRA_SPACE,
  });
  latest.current = {
    enabled,
    scrollBehavior,
    windowHeight,
    metrics,
    onScrollToInput,
    getContainerNode,
    scrollToOffset,
    extraSpace: extraSpace ?? extraScrollHeight ?? DEFAULT_EXTRA_SPACE,
  };

  useEffect(() => {
    if (extraScrollHeight != null) {
      warnOnce(
        'deprecated-extra-scroll-height',
        '`extraScrollHeight` is deprecated; rename it to `extraSpace`. The old ' +
          'name still works and will be removed in the next major version.',
      );
    }
  }, [extraScrollHeight]);

  const performScroll = useCallback(async (reason: ScrollReason): Promise<void> => {
    const current = latest.current;
    if (!current.enabled || !current.metrics.isVisible) {
      return;
    }

    const input = getFocusedInput();
    if (!input) {
      warnIfFocusDetectionUnavailable();
      return;
    }
    lastFocusedRef.current = input;

    const container = current.getContainerNode();
    if (!container) {
      return;
    }

    const runId = ++runIdRef.current;
    const [containerRect, inputRect] = await Promise.all([
      measureInWindow(container),
      measureInWindow(input),
    ]);

    // Superseded by a newer run, or the component went away while measuring.
    if (runId !== runIdRef.current) {
      return;
    }
    if (!containerRect || !inputRect) {
      return;
    }

    const result = solveScroll({
      containerRect,
      inputRect,
      windowHeight: current.windowHeight,
      occludedHeight: current.metrics.occludedHeight,
      currentOffset: offsetRef.current,
      contentHeight: contentHeightRef.current,
      containerHeight: containerHeightRef.current,
      extraSpace: current.extraSpace,
      behavior: current.scrollBehavior,
    });

    if (!result.shouldScroll) {
      return;
    }

    const from = offsetRef.current;
    current.scrollToOffset(result.offset, true);
    offsetRef.current = result.offset;

    current.onScrollToInput?.({
      target: getNodeTag(input),
      from,
      to: result.offset,
      inputRect,
      reason,
    });
  }, []);

  // Notify listeners of normalised geometry changes.
  useEffect(() => {
    onKeyboardChange?.(metrics);
  }, [metrics, onKeyboardChange]);

  // React to the keyboard opening, resizing, or closing.
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (metrics.isVisible) {
      if (!wasVisibleRef.current) {
        offsetBeforeKeyboardRef.current = offsetRef.current;
        wasVisibleRef.current = true;
      }
      void performScroll('keyboard');
      return;
    }

    if (!wasVisibleRef.current) {
      return;
    }
    wasVisibleRef.current = false;
    lastFocusedRef.current = null;

    if (!resetScrollOnHide) {
      return;
    }
    const target =
      typeof resetScrollOnHide === 'object'
        ? resetScrollOnHide.y
        : offsetBeforeKeyboardRef.current;
    latest.current.scrollToOffset(target, true);
    offsetRef.current = target;
  }, [enabled, metrics, resetScrollOnHide, performScroll]);

  /**
   * Watch for focus moving between inputs while the keyboard stays open.
   *
   * No platform event covers this: iOS emits nothing for a focus change alone,
   * and on Android API 30+ `ReactRootView` only reports keyboard *visibility*
   * changes. The check is a single property read with no bridge traffic, and
   * only runs while the keyboard is actually visible.
   */
  useEffect(() => {
    if (!enabled || !trackFocusChanges || !metrics.isVisible) {
      return;
    }

    const intervalId = setInterval(() => {
      const input = getFocusedInput();
      if (input && input !== lastFocusedRef.current) {
        lastFocusedRef.current = input;
        void performScroll('focus');
      }
    }, FOCUS_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [enabled, trackFocusChanges, metrics.isVisible, performScroll]);

  // Invalidate any in-flight measurement when the component goes away.
  useEffect(() => () => {
    runIdRef.current += 1;
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    containerHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number): void => {
      const previous = contentHeightRef.current;
      contentHeightRef.current = height;
      // Content grew or shrank under an open keyboard (an inline error message,
      // an expanding text area) — the focused input may have moved.
      if (previous !== height && latest.current.metrics.isVisible) {
        void performScroll('layout');
      }
    },
    [performScroll],
  );

  return { metrics, handleScroll, handleLayout, handleContentSizeChange };
}
