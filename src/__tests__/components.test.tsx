import { act, render, screen } from '@testing-library/react-native';
import { Dimensions, StyleSheet, Text, TextInput, View } from 'react-native';

import { KeyboardAvoider } from '../components/KeyboardAvoider';
import { KeyboardAwareFlatList } from '../components/KeyboardAwareFlatList';
import { KeyboardAwareFooter } from '../components/KeyboardAwareFooter';
import { KeyboardAwareScrollView } from '../components/KeyboardAwareScrollView';
import { keyboardStore } from '../core/store';
import { emitKeyboardHide, emitKeyboardShow } from './helpers/keyboardEvents';

const WINDOW_HEIGHT = Dimensions.get('window').height;

async function showKeyboard(height = 300): Promise<void> {
  await act(async () => {
    emitKeyboardShow({ height, windowHeight: WINDOW_HEIGHT });
  });
}

async function hideKeyboard(): Promise<void> {
  await act(async () => {
    emitKeyboardHide();
  });
}

function paddingBottomOf(testID: string): unknown {
  return StyleSheet.flatten(screen.getByTestId(testID).props.contentContainerStyle)
    ?.paddingBottom;
}

interface User {
  id: string;
  name: string;
}

const USERS: User[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Grace' },
];

afterEach(async () => {
  await hideKeyboard();
});

describe('KeyboardAwareScrollView', () => {
  it('renders its children', async () => {
    await render(
      <KeyboardAwareScrollView>
        <TextInput placeholder="Name" />
        <TextInput placeholder="Email" />
      </KeyboardAwareScrollView>,
    );

    expect(screen.getByPlaceholderText('Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
  });

  it('defaults keyboardShouldPersistTaps to "handled"', async () => {
    // Without this, the first tap on a button only dismisses the keyboard.
    await render(<KeyboardAwareScrollView testID="scroll" />);

    expect(screen.getByTestId('scroll').props.keyboardShouldPersistTaps).toBe(
      'handled',
    );
  });

  it('lets the caller override the defaults', async () => {
    await render(
      <KeyboardAwareScrollView
        testID="scroll"
        keyboardShouldPersistTaps="never"
        keyboardDismissMode="interactive"
      />,
    );

    const props = screen.getByTestId('scroll').props;
    expect(props.keyboardShouldPersistTaps).toBe('never');
    expect(props.keyboardDismissMode).toBe('interactive');
  });

  it('forwards unrelated ScrollView props untouched', async () => {
    await render(
      <KeyboardAwareScrollView
        testID="scroll"
        horizontal={false}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="form"
      />,
    );

    const props = screen.getByTestId('scroll').props;
    expect(props.showsVerticalScrollIndicator).toBe(false);
    expect(props.accessibilityLabel).toBe('form');
  });

  it('extends the content while the keyboard is open, then restores it', async () => {
    await render(<KeyboardAwareScrollView testID="scroll" />);

    expect(paddingBottomOf('scroll')).toBeUndefined();

    await showKeyboard(300);
    expect(paddingBottomOf('scroll')).toBe(300);

    await hideKeyboard();
    expect(paddingBottomOf('scroll')).toBeUndefined();
  });

  it('adds to the caller’s own content padding rather than replacing it', async () => {
    await render(
      <KeyboardAwareScrollView
        testID="scroll"
        contentContainerStyle={{ paddingBottom: 40 }}
      />,
    );

    await showKeyboard(300);

    expect(paddingBottomOf('scroll')).toBe(340);
  });

  it('does not pad when applyKeyboardPadding is off', async () => {
    await render(
      <KeyboardAwareScrollView testID="scroll" applyKeyboardPadding={false} />,
    );

    await showKeyboard(300);

    expect(paddingBottomOf('scroll')).toBeUndefined();
  });

  it('still calls a caller-supplied onLayout', async () => {
    const onLayout = jest.fn();
    await render(<KeyboardAwareScrollView testID="scroll" onLayout={onLayout} />);

    await act(async () => {
      screen.getByTestId('scroll').props.onLayout({
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } },
      });
    });

    expect(onLayout).toHaveBeenCalled();
  });

  it('still calls a caller-supplied onScroll', async () => {
    const onScroll = jest.fn();
    await render(<KeyboardAwareScrollView testID="scroll" onScroll={onScroll} />);

    await act(async () => {
      screen.getByTestId('scroll').props.onScroll({
        nativeEvent: { contentOffset: { x: 0, y: 120 } },
      });
    });

    expect(onScroll).toHaveBeenCalled();
  });

  it('releases its keyboard subscription on unmount', async () => {
    const view = await render(<KeyboardAwareScrollView testID="scroll" />);
    expect(keyboardStore.listenerCount()).toBeGreaterThan(0);

    await act(async () => {
      view.unmount();
    });

    expect(keyboardStore.listenerCount()).toBe(0);
  });

  it('behaves like a plain ScrollView when disabled', async () => {
    await render(<KeyboardAwareScrollView testID="scroll" enabled={false} />);

    await showKeyboard(300);

    expect(screen.getByTestId('scroll')).toBeTruthy();
  });
});

describe('KeyboardAwareFlatList', () => {
  it('renders items through the normal FlatList API', async () => {
    await render(
      <KeyboardAwareFlatList<User>
        testID="list"
        data={USERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />,
    );

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Grace')).toBeTruthy();
  });

  it('supports list header and footer components', async () => {
    await render(
      <KeyboardAwareFlatList<User>
        data={USERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
        ListHeaderComponent={<Text>Header</Text>}
        ListFooterComponent={<Text>Footer</Text>}
      />,
    );

    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });

  it('extends content while the keyboard is open', async () => {
    await render(
      <KeyboardAwareFlatList<User>
        testID="list"
        data={USERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />,
    );

    await showKeyboard(300);

    expect(paddingBottomOf('list')).toBe(300);
  });

  it('leaves an inverted list untouched', async () => {
    await render(
      <KeyboardAwareFlatList<User>
        testID="list"
        inverted
        data={USERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />,
    );

    await showKeyboard(300);

    // Auto-scroll stands down for inverted lists, so no padding is injected...
    expect(paddingBottomOf('list')).toBeUndefined();
    // ...but the list itself still works.
    expect(screen.getByText('Ada')).toBeTruthy();
  });
});

describe('KeyboardAvoider', () => {
  it('renders its children', async () => {
    await render(
      <KeyboardAvoider testID="avoider">
        <Text>Login</Text>
      </KeyboardAvoider>,
    );

    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('renders a plain View when disabled', async () => {
    await render(
      <KeyboardAvoider testID="avoider" enabled={false}>
        <Text>Login</Text>
      </KeyboardAvoider>,
    );

    await showKeyboard(300);

    expect(screen.getByTestId('avoider')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('survives the keyboard opening and closing', async () => {
    await render(
      <KeyboardAvoider testID="avoider">
        <TextInput placeholder="Email" />
      </KeyboardAvoider>,
    );

    await showKeyboard(300);
    await hideKeyboard();

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
  });
});

describe('KeyboardAwareFooter', () => {
  it('renders its children', async () => {
    await render(
      <KeyboardAwareFooter testID="footer">
        <Text>Continue</Text>
      </KeyboardAwareFooter>,
    );

    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('works inside a form layout without disturbing it', async () => {
    await render(
      <View style={{ flex: 1 }}>
        <KeyboardAwareScrollView>
          <TextInput placeholder="Name" />
        </KeyboardAwareScrollView>
        <KeyboardAwareFooter>
          <Text>Continue</Text>
        </KeyboardAwareFooter>
      </View>,
    );

    await showKeyboard(300);

    expect(screen.getByPlaceholderText('Name')).toBeTruthy();
    expect(screen.getByText('Continue')).toBeTruthy();
  });
});
