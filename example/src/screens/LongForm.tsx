import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';

import { Button, Field, Note, styles } from '../ui';

const FIELDS = Array.from({ length: 24 }, (_, index) => `Field ${index + 1}`);

/**
 * A form far longer than the screen.
 *
 * The interesting cases are the very first field (should not move at all) and
 * the very last one (only reachable because the content is extended while the
 * keyboard is open).
 */
export function LongForm() {
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
    >
      <Text style={styles.heading}>Long form</Text>
      <Note>
        24 fields. Check the first field does not jump, and that the last field
        can still be scrolled clear of the keyboard.
      </Note>

      {FIELDS.map((label) => (
        <Field key={label} label={label} placeholder="Type here" />
      ))}

      <View style={{ marginTop: 8 }}>
        <Button title="Submit" />
      </View>
    </KeyboardAwareScrollView>
  );
}
