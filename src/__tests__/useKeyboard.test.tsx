import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { keyboardStore } from '../core/store';
import { useKeyboard } from '../hooks/useKeyboard';
import { emitKeyboardHide, emitKeyboardShow } from './helpers/keyboardEvents';
import type { KeyboardEvent } from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;

async function showKeyboard(
  height: number,
  extra: { duration?: number; easing?: KeyboardEvent['easing'] } = {},
): Promise<void> {
  await act(async () => {
    emitKeyboardShow({ height, windowHeight: WINDOW_HEIGHT, ...extra });
  });
}

async function hideKeyboard(): Promise<void> {
  await act(async () => {
    emitKeyboardHide();
  });
}

describe('useKeyboard', () => {
  afterEach(async () => {
    await hideKeyboard();
  });

  it('reports a hidden keyboard initially', async () => {
    const { result } = await renderHook(() => useKeyboard());

    expect(result.current?.isKeyboardVisible).toBe(false);
    expect(result.current?.keyboardHeight).toBe(0);
    expect(result.current?.occludedHeight).toBe(0);
  });

  it('reports geometry once the keyboard appears', async () => {
    const { result } = await renderHook(() => useKeyboard());

    await showKeyboard(300);

    expect(result.current?.isKeyboardVisible).toBe(true);
    expect(result.current?.keyboardHeight).toBe(300);
    expect(result.current?.occludedHeight).toBe(300);
  });

  it('returns to zero when the keyboard hides', async () => {
    const { result } = await renderHook(() => useKeyboard());

    await showKeyboard(300);
    await hideKeyboard();

    expect(result.current?.isKeyboardVisible).toBe(false);
    expect(result.current?.keyboardHeight).toBe(0);
  });

  it('exposes animation timing', async () => {
    const { result } = await renderHook(() => useKeyboard());

    await showKeyboard(300, { duration: 350, easing: 'easeInEaseOut' });

    expect(result.current?.keyboardAnimationDuration).toBe(350);
    expect(result.current?.keyboardAnimationEasing).toBe('easeInEaseOut');
  });

  it('subtracts an explicit bottom inset from the keyboard height', async () => {
    const { result } = await renderHook(() => useKeyboard({ bottomInset: 34 }));

    await showKeyboard(300);

    // The keyboard covers 300pt of the window, 34pt of which is the home
    // indicator area, so the keyboard itself is 266pt tall.
    expect(result.current?.occludedHeight).toBe(300);
    expect(result.current?.keyboardHeight).toBe(266);
  });

  it('shares one set of native listeners between many consumers', async () => {
    const first = await renderHook(() => useKeyboard());
    const second = await renderHook(() => useKeyboard());
    const third = await renderHook(() => useKeyboard());

    expect(keyboardStore.listenerCount()).toBe(3);

    await showKeyboard(300);

    expect(first.result.current?.isKeyboardVisible).toBe(true);
    expect(second.result.current?.isKeyboardVisible).toBe(true);
    expect(third.result.current?.isKeyboardVisible).toBe(true);

    await act(async () => {
      first.unmount();
      second.unmount();
      third.unmount();
    });
  });

  it('detaches from the store on unmount', async () => {
    const { unmount } = await renderHook(() => useKeyboard());
    expect(keyboardStore.listenerCount()).toBe(1);

    await act(async () => {
      unmount();
    });

    expect(keyboardStore.listenerCount()).toBe(0);
  });

  it('keeps a stable result object across unrelated re-renders', async () => {
    const { result, rerender } = await renderHook(() => useKeyboard());
    const first = result.current;

    await act(async () => {
      await rerender({});
    });

    expect(result.current).toBe(first);
  });
});
