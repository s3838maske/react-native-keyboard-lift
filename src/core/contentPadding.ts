import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Extend a content container's bottom padding by the covered height.
 *
 * Scrolling can only reveal an input if there is somewhere to scroll *to*. For
 * the last field in a form there usually is not, so the padding is what makes
 * the final input reachable at all.
 *
 * Any padding the caller already set is preserved and added to, rather than
 * overwritten. Non-numeric padding (a percentage) cannot be added to safely,
 * so it is left alone and the extra space is appended as a separate layer.
 */
export function withKeyboardPadding(
  style: StyleProp<ViewStyle>,
  extraPadding: number,
): StyleProp<ViewStyle> {
  if (!Number.isFinite(extraPadding) || extraPadding <= 0) {
    return style;
  }

  const flattened = StyleSheet.flatten(style);
  const existing = flattened?.paddingBottom;
  const base = typeof existing === 'number' ? existing : 0;

  return [style, { paddingBottom: base + extraPadding }];
}
