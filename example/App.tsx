import { useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { SCREENS } from './src/screens';
import type { Screen } from './src/screens';
import { colors, styles } from './src/ui';

function Menu({ onSelect }: { onSelect: (screen: Screen) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20 }}
    >
      <Text style={styles.heading}>react-native-keyboard-lift</Text>
      <Text style={{ color: colors.muted, marginBottom: 24 }}>
        Running on {Platform.OS}. Each screen exercises a different keyboard
        situation — work through them on a real device.
      </Text>

      {SCREENS.map((screen) => (
        <Pressable
          key={screen.key}
          onPress={() => onSelect(screen)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            padding: 16,
            borderRadius: 10,
            marginBottom: 10,
            backgroundColor: pressed ? colors.border : colors.surface,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {screen.title}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}>
            {screen.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Chrome({ screen, onBack }: { screen: Screen; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const Component = screen.component;

  return (
    <View style={styles.screen}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={onBack} accessibilityRole="button" hitSlop={12}>
          <Text style={{ color: colors.accent, fontSize: 16 }}>‹ Back</Text>
        </Pressable>
        <Text
          style={{
            marginLeft: 12,
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
          }}
        >
          {screen.title}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Component />
      </View>
    </View>
  );
}

export default function App() {
  const [active, setActive] = useState<Screen | null>(null);

  return (
    // SafeAreaProvider is optional for the library, but installing it gives the
    // most accurate Android navigation-bar inset. The "Safe area & metrics"
    // screen shows the difference it makes.
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {active ? (
        <Chrome screen={active} onBack={() => setActive(null)} />
      ) : (
        <Menu onSelect={setActive} />
      )}
    </SafeAreaProvider>
  );
}
