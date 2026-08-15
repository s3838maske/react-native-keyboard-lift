import { findNodeHandle } from 'react-native';

import type { MeasurableNode } from '../types';
import { warnOnce } from './warn';

interface TextInputStateModule {
  currentlyFocusedInput?: () => MeasurableNode | null;
}

/**
 * React Native does not expose "which input is focused" on its public surface,
 * and focus events do not bubble, so a parent scroll view cannot observe a
 * descendant gaining focus.
 *
 * `TextInputState` is the internal module React Native itself uses for this.
 * It is reachable through the `./*` entry in React Native's `exports` map,
 * but that entry is `null` under the `react-native-strict-api` condition — so
 * the import is attempted defensively and the library stays fully functional
 * without it via {@link setManuallyFocusedInput}.
 */
let readNativeFocus: (() => MeasurableNode | null) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const imported = require('react-native/Libraries/Components/TextInput/TextInputState') as
    | (TextInputStateModule & { default?: TextInputStateModule })
    | undefined;

  const textInputState = imported?.default ?? imported;

  if (typeof textInputState?.currentlyFocusedInput === 'function') {
    const getter = textInputState.currentlyFocusedInput.bind(textInputState);
    readNativeFocus = () => getter() ?? null;
  }
} catch {
  readNativeFocus = null;
}

let manuallyFocusedInput: MeasurableNode | null = null;

/**
 * Register the focused input explicitly.
 *
 * Used by `useKeyboardAwareInput()` as an event-driven alternative to focus
 * detection, for projects on React Native's strict API where the internal
 * module is unreachable.
 */
export function setManuallyFocusedInput(node: MeasurableNode | null): void {
  manuallyFocusedInput = node;
}

/** The explicitly registered input, if any. */
export function getManuallyFocusedInput(): MeasurableNode | null {
  return manuallyFocusedInput;
}

/** The input that currently has focus, or `null` if none can be determined. */
export function getFocusedInput(): MeasurableNode | null {
  if (readNativeFocus) {
    const node = readNativeFocus();
    if (node) {
      return node;
    }
  }
  return manuallyFocusedInput;
}

/** Whether focus can be detected without the caller registering inputs. */
export function isAutomaticFocusDetectionAvailable(): boolean {
  return readNativeFocus != null;
}

/** React node handle of a measurable node, when one can be resolved. */
export function getNodeTag(node: MeasurableNode | null): number | null {
  if (!node) {
    return null;
  }
  try {
    // A host instance is a valid argument at runtime, but its public type does
    // not overlap with the declared parameter union.
    return findNodeHandle(node as unknown as Parameters<typeof findNodeHandle>[0]) ?? null;
  } catch {
    return null;
  }
}

/** Warn once if we have no way at all of knowing what is focused. */
export function warnIfFocusDetectionUnavailable(): void {
  if (!isAutomaticFocusDetectionAvailable() && !manuallyFocusedInput) {
    warnOnce(
      'no-focus-detection',
      'Unable to detect the focused TextInput automatically on this React Native ' +
        'build (the internal TextInputState module is unavailable, which is expected ' +
        'under the strict API). Automatic scrolling is disabled. Attach ' +
        '`useKeyboardAwareInput()` to your inputs to restore it.',
    );
  }
}

/** Test-only: clear the manual registration. */
export function resetFocusState(): void {
  manuallyFocusedInput = null;
}
