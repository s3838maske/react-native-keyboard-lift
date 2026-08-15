import { useCallback, useEffect, useRef } from 'react';

import {
  getManuallyFocusedInput,
  setManuallyFocusedInput,
} from '../core/focus';
import type { MeasurableNode } from '../types';

/** Props to spread onto a `TextInput`. */
export interface KeyboardAwareInputBinding<T extends MeasurableNode> {
  ref: (node: T | null) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Register an input explicitly, as an event-driven alternative to automatic
 * focus detection.
 *
 * Automatic detection reads React Native's internal `TextInputState`, which is
 * unavailable to projects using the strict API. This hook covers that case,
 * and also removes the need for focus polling entirely.
 *
 * ```tsx
 * const nameInput = useKeyboardAwareInput<TextInput>();
 * <TextInput {...nameInput} placeholder="Name" />
 * ```
 *
 * Handlers of your own still work — spread this first, then add yours:
 *
 * ```tsx
 * <TextInput {...nameInput} onFocus={handleFocus} />
 * ```
 *
 * ...but call `nameInput.onFocus()` from your handler if you do, so the
 * registration still happens.
 */
export function useKeyboardAwareInput<
  T extends MeasurableNode = MeasurableNode,
>(): KeyboardAwareInputBinding<T> {
  const nodeRef = useRef<T | null>(null);

  const ref = useCallback((node: T | null): void => {
    nodeRef.current = node;
  }, []);

  const onFocus = useCallback((): void => {
    setManuallyFocusedInput(nodeRef.current);
  }, []);

  const clearIfOurs = useCallback((): void => {
    // Only stand down if we are still the registered input: React Native does
    // not guarantee that blur of the old input precedes focus of the new one.
    if (nodeRef.current && getManuallyFocusedInput() === nodeRef.current) {
      setManuallyFocusedInput(null);
    }
  }, []);

  useEffect(() => clearIfOurs, [clearIfOurs]);

  return { ref, onFocus, onBlur: clearIfOurs };
}
