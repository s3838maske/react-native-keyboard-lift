import { StyleSheet } from 'react-native';

import { withKeyboardPadding } from '../core/contentPadding';

function flattenedPaddingBottom(style: ReturnType<typeof withKeyboardPadding>) {
  return StyleSheet.flatten(style)?.paddingBottom;
}

describe('withKeyboardPadding', () => {
  it('returns the original style when there is nothing to add', () => {
    const style = { padding: 16 };
    expect(withKeyboardPadding(style, 0)).toBe(style);
    expect(withKeyboardPadding(style, -10)).toBe(style);
    expect(withKeyboardPadding(style, Number.NaN)).toBe(style);
  });

  it('adds padding when the style has none', () => {
    expect(flattenedPaddingBottom(withKeyboardPadding({ padding: 16 }, 300))).toBe(300);
  });

  it('adds to existing padding rather than replacing it', () => {
    expect(
      flattenedPaddingBottom(withKeyboardPadding({ paddingBottom: 40 }, 300)),
    ).toBe(340);
  });

  it('handles an undefined style', () => {
    expect(flattenedPaddingBottom(withKeyboardPadding(undefined, 300))).toBe(300);
  });

  it('handles an array style, using the winning padding value', () => {
    const style = [{ paddingBottom: 10 }, { paddingBottom: 25 }];
    expect(flattenedPaddingBottom(withKeyboardPadding(style, 300))).toBe(325);
  });

  it('leaves non-numeric padding alone instead of producing nonsense', () => {
    // A percentage cannot be added to a point value; the extra space is
    // applied on top rather than concatenated into an invalid string.
    expect(
      flattenedPaddingBottom(withKeyboardPadding({ paddingBottom: '10%' }, 300)),
    ).toBe(300);
  });

  it('does not mutate the style it was given', () => {
    const style = { paddingBottom: 40 };
    withKeyboardPadding(style, 300);
    expect(style.paddingBottom).toBe(40);
  });
});
