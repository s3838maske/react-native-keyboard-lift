import { Text, View } from 'react-native';
import {
  KeyboardAwareFooter,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-lift';

import { Button, Field, Note, styles } from '../ui';

/**
 * The pinned "Continue" button layout.
 *
 * The scroll view keeps the focused input visible while the footer rides above
 * the keyboard. With the keyboard closed the footer sits on the safe-area
 * inset, clearing the home indicator or gesture bar.
 */
export function BottomActionButton() {
  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Bottom action button</Text>
        <Note>
          The Continue button should never be covered, and should never overlap
          the gesture bar when the keyboard is closed.
        </Note>

        <Field label="Card number" placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
        <Field label="Name on card" placeholder="Ada Lovelace" />
        <Field label="Expiry" placeholder="12/29" keyboardType="number-pad" />
        <Field label="Security code" placeholder="123" keyboardType="number-pad" secureTextEntry />
        <Field label="Billing postcode" placeholder="NW1 6XE" />
      </KeyboardAwareScrollView>

      <KeyboardAwareFooter style={styles.footer}>
        <Button title="Continue" />
      </KeyboardAwareFooter>
    </View>
  );
}
