import { Keyboard } from 'react-native';

import { keyboardStore } from '../core/store';
import { emitKeyboardHide, emitKeyboardShow } from './helpers/keyboardEvents';

describe('keyboardStore', () => {
  afterEach(() => {
    emitKeyboardHide();
  });

  it('starts with no subscribers and no state', () => {
    expect(keyboardStore.listenerCount()).toBe(0);
    expect(keyboardStore.getSnapshot().isVisible).toBe(false);
  });

  it('records keyboard geometry when the keyboard shows', () => {
    const unsubscribe = keyboardStore.subscribe(() => {});

    emitKeyboardShow({ height: 300 });

    const snapshot = keyboardStore.getSnapshot();
    expect(snapshot.isVisible).toBe(true);
    expect(snapshot.event?.endCoordinates.height).toBe(300);

    unsubscribe();
  });

  it('notifies every subscriber', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = keyboardStore.subscribe(first);
    const unsubscribeSecond = keyboardStore.subscribe(second);

    emitKeyboardShow({ height: 300 });

    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('attaches native listeners once regardless of subscriber count', () => {
    const addListener = jest.spyOn(Keyboard, 'addListener');
    addListener.mockClear();

    const unsubscribers = [
      keyboardStore.subscribe(() => {}),
      keyboardStore.subscribe(() => {}),
      keyboardStore.subscribe(() => {}),
    ];

    // One pair of show/hide listeners (plus the iOS frame-change listener),
    // not one pair per subscriber.
    const callsForFirstSubscriber = addListener.mock.calls.length;
    expect(callsForFirstSubscriber).toBeLessThanOrEqual(3);
    expect(keyboardStore.listenerCount()).toBe(3);

    unsubscribers.forEach((unsubscribe) => unsubscribe());
    addListener.mockRestore();
  });

  it('removes every native listener once the last subscriber leaves', () => {
    const removals: jest.Mock[] = [];
    const addListener = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation(() => {
        const remove = jest.fn();
        removals.push(remove);
        return { remove } as unknown as ReturnType<typeof Keyboard.addListener>;
      });

    const unsubscribe = keyboardStore.subscribe(() => {});
    expect(removals.length).toBeGreaterThan(0);

    unsubscribe();

    expect(removals.every((remove) => remove.mock.calls.length === 1)).toBe(true);
    expect(keyboardStore.listenerCount()).toBe(0);

    addListener.mockRestore();
  });

  it('does not notify subscribers for a repeated identical state', () => {
    const listener = jest.fn();
    const unsubscribe = keyboardStore.subscribe(listener);

    emitKeyboardHide();
    const callsAfterRedundantHide = listener.mock.calls.length;

    emitKeyboardHide();
    expect(listener.mock.calls.length).toBe(callsAfterRedundantHide);

    unsubscribe();
  });

  it('stops notifying a subscriber that has unsubscribed', () => {
    const listener = jest.fn();
    const unsubscribe = keyboardStore.subscribe(listener);
    // Keep the store alive so listeners are not torn down entirely.
    const keepAlive = keyboardStore.subscribe(() => {});

    unsubscribe();
    listener.mockClear();

    emitKeyboardShow({ height: 300 });

    expect(listener).not.toHaveBeenCalled();
    keepAlive();
  });
});
