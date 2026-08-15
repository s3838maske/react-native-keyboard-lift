import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';

import { Button, Field, Note, colors, styles } from '../ui';

/**
 * A form inside a React Native `Modal`.
 *
 * The awkward case is opening the modal *from a focused input*, so the
 * keyboard is already up when the modal mounts. The keyboard store seeds
 * itself from `Keyboard.isVisible()` on first subscription precisely so this
 * works.
 */
export function ModalForm() {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.screen, styles.content]}>
      <Text style={styles.heading}>Modal form</Text>
      <Note>
        Focus the field below, then open the modal without dismissing the
        keyboard. The modal&apos;s own fields should still behave.
      </Note>

      <Field label="Focus me first" placeholder="Then open the modal" />
      <Button title="Open modal" onPress={() => setVisible(true)} />

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAwareScrollView
          style={[styles.screen, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.heading}>Inside a modal</Text>
          <Field label="Street" placeholder="221B Baker Street" />
          <Field label="City" placeholder="London" />
          <Field label="Postcode" placeholder="NW1 6XE" />
          <Field label="Country" placeholder="United Kingdom" />
          <Field label="Delivery notes" placeholder="Leave with the neighbour" />

          <View style={{ marginTop: 8 }}>
            <Button title="Close" onPress={() => setVisible(false)} />
          </View>
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}
