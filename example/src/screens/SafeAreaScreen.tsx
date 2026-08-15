import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, useKeyboard } from 'react-native-smart-keyboard';

import { Field, Note, colors, styles } from '../ui';

/**
 * Live readout of the normalised keyboard geometry.
 *
 * This is the screen to open when something looks wrong on a specific device:
 * `occludedHeight` should always equal `keyboardHeight` plus the bottom inset
 * on Android, and the two should differ by the home indicator on iOS.
 */
export function SafeAreaScreen() {
  const insets = useSafeAreaInsets();
  const {
    isKeyboardVisible,
    keyboardHeight,
    occludedHeight,
    keyboardAnimationDuration,
    keyboardAnimationEasing,
  } = useKeyboard();

  const rows: Array<[string, string]> = [
    ['isKeyboardVisible', String(isKeyboardVisible)],
    ['keyboardHeight', `${keyboardHeight.toFixed(1)}pt`],
    ['occludedHeight', `${occludedHeight.toFixed(1)}pt`],
    ['difference', `${(occludedHeight - keyboardHeight).toFixed(1)}pt`],
    ['duration', `${keyboardAnimationDuration}ms`],
    ['easing', keyboardAnimationEasing],
    ['inset.top', `${insets.top.toFixed(1)}pt`],
    ['inset.bottom', `${insets.bottom.toFixed(1)}pt`],
  ];

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Safe area &amp; metrics</Text>
      <Note>
        The difference between occludedHeight and keyboardHeight should match
        the bottom inset. If it does not, the safe-area provider is missing.
      </Note>

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {rows.map(([key, value], index) => (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 12,
              backgroundColor: index % 2 ? colors.surface : colors.background,
            }}
          >
            <Text style={{ color: colors.muted }}>{key}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>
          </View>
        ))}
      </View>

      <Field label="Focus to update the numbers" placeholder="Tap here" />
    </KeyboardAwareScrollView>
  );
}
