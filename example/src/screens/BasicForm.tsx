import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';

import { Button, Field, Note, styles } from '../ui';

/**
 * The zero-configuration case: no props at all.
 *
 * Tap each field in turn and confirm none of them is ever covered.
 */
export function BasicForm() {
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Basic form</Text>
      <Note>
        No props. Every field should stay visible when focused, on both
        platforms.
      </Note>

      <Field label="Name" placeholder="Ada Lovelace" />
      <Field label="Email" placeholder="ada@example.com" keyboardType="email-address" />
      <Field label="Phone" placeholder="+44 7700 900000" keyboardType="phone-pad" />

      <View style={{ marginTop: 8 }}>
        <Button title="Submit" />
      </View>
    </KeyboardAwareScrollView>
  );
}
