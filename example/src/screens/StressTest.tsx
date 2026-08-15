import { useRef, useState } from 'react';
import type { TextInput} from 'react-native';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';
import type { ScrollToInputInfo } from 'react-native-smart-keyboard';

import { Button, Field, Note, colors, styles } from '../ui';

const FIELD_COUNT = 40;

/**
 * Deliberately hostile input: rapid programmatic focus changes, a very long
 * form, and a live log of every automatic scroll.
 *
 * What to watch for is a *single* scroll per focus change. Duplicate or
 * oscillating entries in the log would mean the solver is fighting itself.
 */
export function StressTest() {
  const inputs = useRef<Array<TextInput | null>>([]);
  const [log, setLog] = useState<string[]>([]);

  const record = (info: ScrollToInputInfo) => {
    setLog((current) =>
      [`${info.reason}: ${info.from.toFixed(0)} → ${info.to.toFixed(0)}`, ...current].slice(0, 8),
    );
  };

  const cycleFocus = () => {
    // Jump between distant fields as fast as React will allow.
    [0, 20, 5, 39, 12].forEach((index, step) => {
      setTimeout(() => inputs.current[index]?.focus(), step * 120);
    });
  };

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      onScrollToInput={record}
    >
      <Text style={styles.heading}>Stress test</Text>
      <Note>
        Press Cycle focus to jump between distant fields every 120ms. Each jump
        should produce exactly one entry in the log below.
      </Note>

      <Button title="Cycle focus rapidly" onPress={cycleFocus} />

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 10,
          padding: 12,
          marginVertical: 20,
          minHeight: 120,
        }}
      >
        <Text style={{ fontWeight: '600', marginBottom: 6, color: colors.text }}>
          Scroll log
        </Text>
        {log.length === 0 ? (
          <Text style={{ color: colors.muted }}>No automatic scrolls yet.</Text>
        ) : (
          log.map((entry, index) => (
            <Text key={index} style={{ color: colors.muted, fontSize: 13 }}>
              {entry}
            </Text>
          ))
        )}
      </View>

      {Array.from({ length: FIELD_COUNT }, (_, index) => (
        <Field
          key={index}
          label={`Field ${index + 1}`}
          placeholder="Type here"
          ref={(node: TextInput | null) => {
            inputs.current[index] = node;
          }}
        />
      ))}
    </KeyboardAwareScrollView>
  );
}
