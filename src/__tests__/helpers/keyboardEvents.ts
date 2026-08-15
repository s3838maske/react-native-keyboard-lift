import { Keyboard, Platform } from 'react-native';
import type { KeyboardEvent, KeyboardEventName } from 'react-native';

/**
 * Build a keyboard event the way the running platform would report it.
 *
 * Android supplies a height with the system bars already removed and no
 * animation information; iOS supplies a screen position, a duration and a
 * curve. Tests that emit events should go through here so they exercise the
 * same shapes the library sees in production.
 */
export function buildKeyboardEvent(options: {
  height: number;
  windowHeight?: number;
  duration?: number;
  easing?: KeyboardEvent['easing'];
}): KeyboardEvent {
  const { height, windowHeight = 800, duration, easing } = options;

  if (Platform.OS === 'ios') {
    return {
      duration: duration ?? 250,
      easing: easing ?? 'keyboard',
      endCoordinates: {
        screenX: 0,
        screenY: windowHeight - height,
        width: 400,
        height,
      },
    };
  }

  return {
    duration: duration ?? 0,
    easing: easing ?? 'keyboard',
    endCoordinates: { screenX: 0, screenY: windowHeight, width: 400, height },
  };
}

interface Emitter {
  emit: (name: string, event: KeyboardEvent) => void;
}

function emit(name: KeyboardEventName, event: KeyboardEvent): void {
  // `Keyboard` delegates to an internal NativeEventEmitter. Driving that
  // emitter directly lets the tests exercise the real subscription path in
  // `core/store.ts` rather than mocking the module away.
  const emitter = (Keyboard as unknown as { _emitter?: Emitter })._emitter;

  if (!emitter?.emit) {
    throw new Error(
      'Unable to reach the Keyboard event emitter; the React Native test ' +
        'environment may have changed shape.',
    );
  }

  emitter.emit(name, event);
}

const SHOW: KeyboardEventName =
  Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE: KeyboardEventName =
  Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Simulate the keyboard appearing. */
export function emitKeyboardShow(options: {
  height: number;
  windowHeight?: number;
  duration?: number;
  easing?: KeyboardEvent['easing'];
}): KeyboardEvent {
  const event = buildKeyboardEvent(options);
  emit(SHOW, event);
  return event;
}

/** Simulate the keyboard disappearing. */
export function emitKeyboardHide(): KeyboardEvent {
  const event = buildKeyboardEvent({ height: 0 });
  emit(HIDE, event);
  return event;
}
