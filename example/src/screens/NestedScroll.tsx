import { ScrollView, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-lift';

import { Field, Note, colors, styles } from '../ui';

/**
 * A keyboard-aware scroll view containing an inner horizontal scroller and an
 * inner vertical one.
 *
 * Only the outer container adjusts. The inner scrollers must keep working
 * normally — the library measures in window coordinates, so nested offsets do
 * not confuse it.
 */
export function NestedScroll() {
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Nested scroll containers</Text>
      <Note>
        The inner scrollers should still scroll independently while the outer
        one handles the keyboard.
      </Note>

      <Field label="Outer field" placeholder="Belongs to the outer scroll view" />

      <Text style={styles.label}>Horizontal scroller</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <View
            key={index}
            style={{
              width: 120,
              height: 80,
              borderRadius: 10,
              marginRight: 12,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.muted }}>Card {index + 1}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.label}>Inner vertical scroller</Text>
      <View
        style={{
          height: 160,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <ScrollView nestedScrollEnabled contentContainerStyle={{ padding: 12 }}>
          {Array.from({ length: 20 }, (_, index) => (
            <Text key={index} style={{ paddingVertical: 6, color: colors.text }}>
              Inner row {index + 1}
            </Text>
          ))}
        </ScrollView>
      </View>

      <Field label="Field below the nest" placeholder="Focus me" />
      <Field label="Last field" placeholder="And me" />
    </KeyboardAwareScrollView>
  );
}
