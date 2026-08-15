import type { KeyboardEvent } from 'react-native';

import { DEFAULT_ANIMATION_DURATION } from '../core/constants';
import { normalizeKeyboardEvent } from '../core/normalize';
import type { NormalizeContext } from '../core/normalize';

function event(
  endCoordinates: Partial<KeyboardEvent['endCoordinates']>,
  overrides: Partial<KeyboardEvent> = {},
): KeyboardEvent {
  return {
    duration: 250,
    easing: 'keyboard',
    endCoordinates: {
      screenX: 0,
      screenY: 0,
      width: 400,
      height: 0,
      ...endCoordinates,
    },
    ...overrides,
  };
}

const ANDROID: NormalizeContext = {
  platform: 'android',
  windowHeight: 800,
  bottomInset: 24,
};

const IOS: NormalizeContext = {
  platform: 'ios',
  windowHeight: 844,
  bottomInset: 34,
};

describe('normalizeKeyboardEvent', () => {
  describe('hidden keyboard', () => {
    it('reports zeroed geometry when not visible', () => {
      const result = normalizeKeyboardEvent(event({ height: 300 }), false, ANDROID);

      expect(result.isVisible).toBe(false);
      expect(result.height).toBe(0);
      expect(result.occludedHeight).toBe(0);
    });

    it('tolerates a null event', () => {
      const result = normalizeKeyboardEvent(null, true, ANDROID);
      expect(result.isVisible).toBe(false);
    });

    it('tolerates an event with no coordinates', () => {
      const malformed = { duration: 0, easing: 'keyboard' } as KeyboardEvent;
      const result = normalizeKeyboardEvent(malformed, true, ANDROID);
      expect(result.isVisible).toBe(false);
    });
  });

  describe('Android', () => {
    // React Native computes `imeInsets.bottom - barInsets.bottom`, so the
    // navigation bar has already been removed from the reported height.
    it('adds the navigation bar inset back to get true occlusion', () => {
      const result = normalizeKeyboardEvent(event({ height: 300 }), true, ANDROID);

      expect(result.height).toBe(300);
      expect(result.occludedHeight).toBe(324);
    });

    it('leaves occlusion equal to height when there is no bottom inset', () => {
      const result = normalizeKeyboardEvent(event({ height: 300 }), true, {
        ...ANDROID,
        bottomInset: 0,
      });

      expect(result.occludedHeight).toBe(300);
    });

    it('ignores screenY, which is the visible frame bottom rather than the keyboard top', () => {
      const withMisleadingScreenY = normalizeKeyboardEvent(
        event({ height: 300, screenY: 800 }),
        true,
        ANDROID,
      );

      expect(withMisleadingScreenY.occludedHeight).toBe(324);
    });

    it('substitutes a default duration, since Android always reports 0', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 300 }, { duration: 0 }),
        true,
        ANDROID,
      );

      expect(result.duration).toBe(DEFAULT_ANIMATION_DURATION);
    });

    it('treats a zero height as hidden', () => {
      const result = normalizeKeyboardEvent(event({ height: 0 }), true, ANDROID);
      expect(result.isVisible).toBe(false);
    });
  });

  describe('iOS', () => {
    it('derives occlusion from screenY', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 336, screenY: 508 }),
        true,
        IOS,
      );

      expect(result.occludedHeight).toBe(336);
      // The home indicator area is part of what the keyboard covers, so the
      // keyboard's own height excludes it.
      expect(result.height).toBe(302);
    });

    it('preserves the reported duration and easing', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 336, screenY: 508 }, { duration: 350, easing: 'easeInEaseOut' }),
        true,
        IOS,
      );

      expect(result.duration).toBe(350);
      expect(result.easing).toBe('easeInEaseOut');
    });

    it('ignores a floating iPad keyboard, matching keyboardLayoutGuide', () => {
      // Floating keyboard: sits mid-screen, does not reach the window bottom.
      const result = normalizeKeyboardEvent(
        event({ height: 250, screenY: 400 }),
        true,
        { platform: 'ios', windowHeight: 1024, bottomInset: 20 },
      );

      expect(result.isVisible).toBe(false);
      expect(result.occludedHeight).toBe(0);
    });

    it('still reports occlusion while being dragged off-screen', () => {
      // Interactive dismissal: the keyboard extends past the window bottom.
      const result = normalizeKeyboardEvent(
        event({ height: 336, screenY: 700 }),
        true,
        IOS,
      );

      expect(result.occludedHeight).toBe(144);
    });

    it('falls back to the reported height when screenY is unusable', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 336, screenY: Number.NaN }),
        true,
        IOS,
      );

      expect(result.occludedHeight).toBe(336);
    });

    it('handles a short hardware-keyboard accessory bar', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 55, screenY: 789 }),
        true,
        IOS,
      );

      expect(result.occludedHeight).toBe(55);
      expect(result.height).toBe(21);
    });
  });

  describe('cross-platform consistency', () => {
    it('reports the same keyboard height for the same physical keyboard', () => {
      // A 300pt keyboard above a 24pt bottom inset, described the way each
      // platform describes it.
      const android = normalizeKeyboardEvent(event({ height: 300 }), true, {
        platform: 'android',
        windowHeight: 800,
        bottomInset: 24,
      });

      const ios = normalizeKeyboardEvent(
        event({ height: 324, screenY: 476 }),
        true,
        { platform: 'ios', windowHeight: 800, bottomInset: 24 },
      );

      expect(android.height).toBe(ios.height);
      expect(android.occludedHeight).toBe(ios.occludedHeight);
    });
  });

  describe('defensive handling', () => {
    it('does not produce NaN from a NaN window height', () => {
      const result = normalizeKeyboardEvent(event({ height: 300 }), true, {
        platform: 'android',
        windowHeight: Number.NaN,
        bottomInset: 24,
      });

      expect(Number.isFinite(result.occludedHeight)).toBe(true);
    });

    it('clamps a negative bottom inset to zero', () => {
      const result = normalizeKeyboardEvent(event({ height: 300 }), true, {
        ...ANDROID,
        bottomInset: -50,
      });

      expect(result.occludedHeight).toBe(300);
    });

    it('normalises an unrecognised easing value', () => {
      const result = normalizeKeyboardEvent(
        event({ height: 300 }, { easing: 'nonsense' as KeyboardEvent['easing'] }),
        true,
        ANDROID,
      );

      expect(result.easing).toBe('keyboard');
    });
  });
});
