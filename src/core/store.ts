import { Keyboard } from 'react-native';
import type { EmitterSubscription, KeyboardEvent } from 'react-native';

import { FRAME_CHANGE_EVENT, HIDE_EVENT, SHOW_EVENT } from './platform';

/** Raw, un-normalised keyboard state as reported by React Native. */
export interface RawKeyboardState {
  event: KeyboardEvent | null;
  isVisible: boolean;
}

const HIDDEN_STATE: RawKeyboardState = { event: null, isVisible: false };

let state: RawKeyboardState = HIDDEN_STATE;
const listeners = new Set<() => void>();
let subscriptions: EmitterSubscription[] = [];

function emit(): void {
  // Copy before iterating: a listener may unsubscribe during notification.
  for (const listener of Array.from(listeners)) {
    listener();
  }
}

/**
 * Whether two events describe the same keyboard position.
 *
 * The platform re-emits events with fresh objects for what is often an
 * identical geometry — Android in particular fires on every relevant global
 * layout pass. Comparing the numbers rather than the object identity keeps
 * those from turning into re-renders.
 */
function sameGeometry(a: KeyboardEvent | null, b: KeyboardEvent | null): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.endCoordinates.height === b.endCoordinates.height &&
    a.endCoordinates.screenY === b.endCoordinates.screenY &&
    a.duration === b.duration
  );
}

function setState(next: RawKeyboardState): void {
  // Every hidden state is equivalent: the geometry is discarded either way.
  if (!state.isVisible && !next.isVisible) {
    return;
  }
  if (state.isVisible === next.isVisible && sameGeometry(state.event, next.event)) {
    return;
  }
  state = next;
  emit();
}

function handleShow(event: KeyboardEvent): void {
  setState({ event, isVisible: true });
}

function handleHide(event: KeyboardEvent): void {
  setState({ event, isVisible: false });
}

/**
 * iOS-only. Keeps geometry fresh when an already-visible keyboard resizes
 * (emoji panel, hardware keyboard, language switch). Ignored while hidden so a
 * frame change that precedes `keyboardWillHide` cannot resurrect the keyboard.
 */
function handleFrameChange(event: KeyboardEvent): void {
  if (state.isVisible) {
    setState({ event, isVisible: true });
  }
}

/**
 * Seed state from the platform.
 *
 * Without this, a component mounted *while the keyboard is already open* — a
 * modal opened from a focused input is the common case — would believe the
 * keyboard is hidden until the next event, which may never arrive.
 */
function seedFromPlatform(): void {
  try {
    if (!Keyboard.isVisible()) {
      return;
    }
    const metrics = Keyboard.metrics();
    if (!metrics) {
      return;
    }
    state = {
      isVisible: true,
      event: { duration: 0, easing: 'keyboard', endCoordinates: metrics },
    };
  } catch {
    // Older or non-standard platforms may not implement these; the first real
    // keyboard event will correct us.
  }
}

function start(): void {
  seedFromPlatform();
  subscriptions.push(Keyboard.addListener(SHOW_EVENT, handleShow));
  subscriptions.push(Keyboard.addListener(HIDE_EVENT, handleHide));
  if (FRAME_CHANGE_EVENT) {
    subscriptions.push(Keyboard.addListener(FRAME_CHANGE_EVENT, handleFrameChange));
  }
}

function stop(): void {
  for (const subscription of subscriptions) {
    subscription.remove();
  }
  subscriptions = [];
  state = HIDDEN_STATE;
}

/**
 * A single set of keyboard listeners shared by every hook and component in the
 * app, attached on first subscriber and torn down on the last.
 *
 * Mounting fifty keyboard-aware inputs therefore costs one pair of native
 * listeners, not fifty.
 */
export const keyboardStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (listeners.size === 1) {
      start();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stop();
      }
    };
  },

  getSnapshot(): RawKeyboardState {
    return state;
  },

  /** Test-only: number of active subscribers. */
  listenerCount(): number {
    return listeners.size;
  },
};
