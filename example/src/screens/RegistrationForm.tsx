import { useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';

import { Button, Field, Note, colors, styles } from '../ui';

/**
 * A form whose height changes while the keyboard is open.
 *
 * Submitting with an empty email reveals an inline error, which grows the
 * content. The library re-checks the focused input on content size changes, so
 * the field stays put rather than sliding under the keyboard.
 */
export function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [showError, setShowError] = useState(false);

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      extraSpace={24}
    >
      <Text style={styles.heading}>Create account</Text>
      <Note>
        Focus the email field, leave it empty and press Create. The inline error
        changes the content height while the keyboard is open.
      </Note>

      <Field label="Full name" placeholder="Ada Lovelace" />
      <Field
        label="Email"
        placeholder="ada@example.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {showError ? (
        <Text style={{ color: '#c0392b', marginTop: -8, marginBottom: 16 }}>
          Enter an email address so we can send you a confirmation link.
        </Text>
      ) : null}

      <Field label="Password" placeholder="••••••••" secureTextEntry />
      <Field label="Confirm password" placeholder="••••••••" secureTextEntry />
      <Field label="Referral code" placeholder="Optional" />

      <View style={{ marginTop: 8 }}>
        <Button title="Create account" onPress={() => setShowError(email === '')} />
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 16 }}>
        Uses extraSpace={24} for a little more breathing room than the default.
      </Text>
    </KeyboardAwareScrollView>
  );
}
