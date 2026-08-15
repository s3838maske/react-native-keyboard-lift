import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-smart-keyboard';

import { Field, Note, styles } from '../ui';

interface Question {
  id: string;
  prompt: string;
}

const QUESTIONS: Question[] = Array.from({ length: 30 }, (_, index) => ({
  id: String(index + 1),
  prompt: `Question ${index + 1}`,
}));

/**
 * A virtualised list of inputs, using the generic form of the component.
 *
 * Worth checking that answers are preserved while scrolling — virtualisation
 * unmounts off-screen rows, and focus tracking must not interfere with that.
 */
export function FlatListForm() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const renderItem = useCallback(
    ({ item }: { item: Question }) => (
      <Field
        label={item.prompt}
        placeholder="Your answer"
        value={answers[item.id] ?? ''}
        onChangeText={(text) =>
          setAnswers((current) => ({ ...current, [item.id]: text }))
        }
      />
    ),
    [answers],
  );

  return (
    <KeyboardAwareFlatList<Question>
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={QUESTIONS}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>FlatList form</Text>
          <Note>
            30 virtualised inputs with a header and footer. The full FlatList
            API still works.
          </Note>
        </View>
      }
      ListFooterComponent={
        <Text style={{ color: '#6b7280', paddingTop: 8 }}>End of list</Text>
      }
    />
  );
}
