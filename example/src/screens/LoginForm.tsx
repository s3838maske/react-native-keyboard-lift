import { Text, View } from 'react-native';
import { KeyboardAvoider } from 'react-native-smart-keyboard';

import { Button, Field, Note, styles } from '../ui';

/**
 * A short, centred form with no scrolling — the case `KeyboardAvoider` exists
 * for.
 *
 * Nothing needs a `keyboardVerticalOffset`: the component measures how much of
 * itself the keyboard actually covers.
 */
export function LoginForm() {
  return (
    <KeyboardAvoider style={[styles.screen, { justifyContent: 'center', padding: 20 }]}>
      <Text style={styles.heading}>Sign in</Text>
      <Note>
        No scroll view. The form lifts by exactly the amount the keyboard
        overlaps it, and not a pixel more.
      </Note>

      <Field label="Email" placeholder="ada@example.com" keyboardType="email-address" />
      <Field label="Password" placeholder="••••••••" secureTextEntry />

      <View style={{ marginTop: 8 }}>
        <Button title="Sign in" />
      </View>
    </KeyboardAvoider>
  );
}
