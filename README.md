# react-native-smart-keyboard

[![CI](https://github.com/s3838maske/react-native-smart-keyboard/actions/workflows/ci.yml/badge.svg)](https://github.com/s3838maske/react-native-smart-keyboard/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/react-native-smart-keyboard.svg)](https://www.npmjs.com/package/react-native-smart-keyboard)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)](#platform-setup)
[![runtime dependencies](https://img.shields.io/badge/runtime%20deps-0-brightgreen.svg)](./package.json)

Zero-configuration keyboard management for React Native. Focused inputs stay
visible, on both platforms, without native code and without a single runtime
dependency.

```tsx
<KeyboardAwareScrollView>
  <TextInput placeholder="Name" />
  <TextInput placeholder="Email" />
  <TextInput placeholder="Phone" />
</KeyboardAwareScrollView>
```

That is the whole setup. No `behavior` prop to guess at, no
`keyboardVerticalOffset` to tune per screen, no platform branches.

---

## Why another keyboard library

Because React Native's raw keyboard events do not mean the same thing on both
platforms, and almost every keyboard bug traces back to that.

Reading `ReactRootView.java` in React Native 0.85:

```java
int height = imeInsets.bottom - barInsets.bottom;   // Android
```

Android reports the keyboard height **with the system bars already
subtracted**. iOS reports the full height from the bottom of the screen. Use
the same number on both and your input sits 24–48pt too low on Android — which
is every Android 15+ device, where edge-to-edge is mandatory and the window is
no longer resized for you.

There is a second, quieter trap:

```java
int screenY = softInputMode == SOFT_INPUT_ADJUST_NOTHING
    ? mVisibleViewArea.bottom - height
    : mVisibleViewArea.bottom;                      // NOT the keyboard top
```

On iOS `endCoordinates.screenY` *is* the top of the keyboard. On Android it is
the bottom of the visible frame. Anything treating that field uniformly is
wrong on one platform.

This library normalises both before doing anything else, and exposes the result
through [`useKeyboard()`](#usekeyboard).

### How it compares

|                              | This library | `KeyboardAvoidingView` | `keyboard-aware-scroll-view` | `keyboard-controller` |
| ---------------------------- | :----------: | :--------------------: | :--------------------------: | :-------------------: |
| Native code required         |      No      |           —            |              No              |          Yes          |
| Runtime dependencies         |    None      |           —            |              2               | Reanimated ≥3 |
| Works in Expo Go             |     Yes      |          Yes           |             Yes              |          No           |
| Scrolls focused input        |     Yes      |           No           |             Yes              |          Yes          |
| Correct under edge-to-edge   |     Yes      |           No           |              No              |          Yes          |
| Actively maintained          |     Yes      |          Yes           |    No — last publish 2022    |          Yes          |
| Frame-synced Android animation |    No      |           No           |              No              |        **Yes**        |

**Use `react-native-keyboard-controller` instead if you need per-frame
animation on Android or interactive-dismissal tracking.** Those require
`WindowInsetsAnimationCallback`, which is unreachable from JavaScript, and it
is an excellent library. This one exists for the case where you want correct
behaviour without adding native code, a Reanimated peer, or a prebuild step.

---

## Installation

```bash
npm install react-native-smart-keyboard
```

```bash
yarn add react-native-smart-keyboard
```

No linking, no pods, no config plugin.

### Recommended companion

```bash
npm install react-native-safe-area-context
```

Optional, but **strongly recommended on Android**. It is the only reliable
source of the navigation-bar inset, which is required to know how much of the
window the keyboard actually covers under edge-to-edge. Without it the library
falls back to a heuristic that returns `0` in edge-to-edge mode, and inputs may
sit slightly too low.

If you already use React Navigation or Expo, you almost certainly have it.

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <YourApp />
    </SafeAreaProvider>
  );
}
```

---

## Quick start

### A form that scrolls

```tsx
import { KeyboardAwareScrollView } from 'react-native-smart-keyboard';

function ContactForm() {
  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: 20 }}>
      <TextInput placeholder="Name" />
      <TextInput placeholder="Email" />
      <TextInput placeholder="Message" multiline />
    </KeyboardAwareScrollView>
  );
}
```

### A form that does not scroll

```tsx
import { KeyboardAvoider } from 'react-native-smart-keyboard';

function LoginScreen() {
  return (
    <KeyboardAvoider style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" secureTextEntry />
      <Button title="Sign in" onPress={signIn} />
    </KeyboardAvoider>
  );
}
```

### A pinned action button

```tsx
import {
  KeyboardAwareFooter,
  KeyboardAwareScrollView,
} from 'react-native-smart-keyboard';

function CheckoutScreen() {
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView>
        <PaymentFields />
      </KeyboardAwareScrollView>

      <KeyboardAwareFooter style={{ padding: 16 }}>
        <Button title="Continue" onPress={submit} />
      </KeyboardAwareFooter>
    </View>
  );
}
```

---

## API

The public surface is four components and two hooks. Everything else is an
implementation detail.

### `<KeyboardAwareScrollView>`

Accepts **every `ScrollView` prop**, plus the shared options below. Two
defaults are changed:

| Prop | Default here | React Native default | Why |
| ---- | ------------ | -------------------- | --- |
| `keyboardShouldPersistTaps` | `'handled'` | `'never'` | So the first tap on a button presses it instead of only dismissing the keyboard. |
| `scrollEventThrottle` | `16` | `0` | So the tracked scroll position stays accurate. |

Both are overridable.

### `<KeyboardAwareFlatList>`

Accepts every `FlatList` prop, including item generics:

```tsx
<KeyboardAwareFlatList<User>
  data={users}
  keyExtractor={(user) => user.id}
  renderItem={({ item }) => <UserRow user={item} />}
  ListHeaderComponent={<Header />}
  refreshControl={<RefreshControl refreshing={busy} onRefresh={reload} />}
/>
```

`inverted` lists are supported in the sense that they keep working — automatic
scrolling stands down for them, because inversion reverses the meaning of a
scroll offset. A development warning explains this once.

### Shared options

Available on both scrollable components.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `enabled` | `boolean` | `true` | Master switch. When off, behaves exactly like the component it wraps. |
| `extraSpace` | `number` | `12` | Gap left between the input and the keyboard. |
| `scrollBehavior` | `'minimal' \| 'center'` | `'minimal'` | `'minimal'` moves the least distance that reveals the input; `'center'` centres it in the remaining space. |
| `resetScrollOnHide` | `boolean \| { x, y }` | `false` | `true` returns to the offset from before the keyboard opened; an object scrolls to those coordinates. |
| `applyKeyboardPadding` | `boolean` | `true` | Extends the content while the keyboard is open so bottom fields are reachable at all. Turn off if you add your own inset. |
| `trackFocusChanges` | `boolean` | `true` | Watch for focus moving between inputs while the keyboard stays open. See [focus detection](#how-focus-is-detected). |
| `bottomInset` | `number` | auto | Override the resolved safe-area inset. Rarely needed. |
| `onKeyboardChange` | `(m: KeyboardMetrics) => void` | — | Called when normalised geometry changes. |
| `onScrollToInput` | `(i: ScrollToInputInfo) => void` | — | Called after an automatic scroll. Useful for debugging. |
| `extraScrollHeight` | `number` | — | **Deprecated** alias of `extraSpace`, for migrating from `react-native-keyboard-aware-scroll-view`. |

### `<KeyboardAvoider>`

For layouts without a scroll view. Accepts every `View` prop, plus:

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `enabled` | `boolean` | `true` | When off, renders a plain `View`. |
| `behavior` | `'padding' \| 'translate'` | `'padding'` | `'padding'` adds bottom padding; `'translate'` shifts the container. The same default is correct on both platforms. |
| `extraSpace` | `number` | `0` | Extra room above the keyboard. |
| `consumedOffset` | `number` | `0` | Points already excluded by an ancestor, such as a bottom tab bar. Subtracted so space is not counted twice. |
| `bottomInset` | `number` | auto | Override the resolved safe-area inset. |

Unlike React Native's `KeyboardAvoidingView`, this measures **how much of
itself** the keyboard covers. A view that already ends above the keyboard is
left alone, which is why there is no `keyboardVerticalOffset`.

### `<KeyboardAwareFooter>`

A bottom bar that rides above the keyboard. Accepts every `View` prop, plus:

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `enabled` | `boolean` | `true` | When off, renders a plain `View`. |
| `extraSpace` | `number` | `0` | Extra room above the keyboard. |
| `applySafeAreaPadding` | `boolean` | `true` | Keep the bottom inset as padding while the keyboard is hidden, clearing the home indicator or gesture bar. |
| `bottomInset` | `number` | auto | Override the resolved safe-area inset. |

### `useKeyboard()`

```tsx
const {
  isKeyboardVisible,
  keyboardHeight,
  occludedHeight,
  keyboardAnimationDuration,
  keyboardAnimationEasing,
} = useKeyboard();
```

| Field | Meaning |
| ----- | ------- |
| `isKeyboardVisible` | Whether the software keyboard is shown. |
| `keyboardHeight` | Height of the keyboard **alone**, excluding system bars. Consistent across platforms. |
| `occludedHeight` | Points of the window covered from the bottom edge, **including** any navigation bar the keyboard draws over. This is the number to use for layout maths. |
| `keyboardAnimationDuration` | Milliseconds. Defaults to 250 on Android, which reports none. |
| `keyboardAnimationEasing` | The reported curve, or `'keyboard'` on Android. |

`isVisible`, `height`, `duration` and `easing` are also available under their
short names.

Every consumer shares one pair of native listeners, so calling this from many
components is cheap.

### `useKeyboardAwareInput()`

Opt-in focus registration, for projects using React Native's strict API where
the internal `TextInputState` module is unreachable.

```tsx
const email = useKeyboardAwareInput<TextInput>();

<TextInput {...email} placeholder="Email" />;
```

If you need your own `onFocus`, call the hook's version from it:

```tsx
<TextInput
  {...email}
  onFocus={(event) => {
    email.onFocus();
    myHandler(event);
  }}
/>
```

---

## Platform setup

### Android

**No configuration is required.** The library reads the IME inset directly, so
it works whether or not the window resizes.

For the best results, leave `windowSoftInputMode` at its default:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:windowSoftInputMode="adjustResize">
```

Notes on modern Android:

- **Edge-to-edge is mandatory from Android 15** (API 35). `adjustResize` no
  longer shrinks your window; the system hands you insets instead. This library
  is built for that world — it does not depend on the window resizing.
- **Install `react-native-safe-area-context`.** Under edge-to-edge it is the
  only way to learn the navigation-bar inset. See
  [installation](#recommended-companion).
- **API 30+ (Android 11+)** uses React Native's `WindowInsetsCompat` path,
  which is accurate. **API 29 and below** falls back to React Native's legacy
  visible-frame heuristic, which is less reliable under edge-to-edge.
- `adjustPan` and `adjustNothing` will not crash anything, but automatic
  scrolling assumes the layout is inset-driven. `adjustResize` is the tested
  configuration.

### iOS

**No configuration is required.**

- Uses `keyboardWillShow` / `keyboardWillHide`, so movement starts with the
  keyboard rather than after it.
- Undocked and floating iPad keyboards are deliberately ignored, matching
  UIKit's own `keyboardLayoutGuide`. A floating keyboard can be dragged
  anywhere and is conventionally not avoided.
- Hardware keyboards work: the accessory bar is reported as a short keyboard
  and treated normally.
- Interactive dismissal keeps reporting occlusion as the keyboard is dragged
  away.

---

## How it works

### Normalising the geometry

Everything starts by turning platform-specific numbers into one honest pair:

```
iOS       occludedHeight = windowHeight − endCoordinates.screenY
Android   occludedHeight = endCoordinates.height + bottomSafeAreaInset

both      keyboardHeight = occludedHeight − bottomSafeAreaInset
```

### The scroll calculation

All arithmetic happens in **window coordinates**, so the status bar, notch and
navigation bar never enter into it — the library only ever compares two
rectangles measured the same way.

```
        focused input
              ↓
   measure input + container   (measureInWindow, in parallel)
              ↓
   visibleTop    = container.top
   visibleBottom = min(container.bottom, windowHeight − occludedHeight)
              ↓
   hiddenBelow = input.bottom + extraSpace − visibleBottom
   hiddenAbove = visibleTop − input.top
              ↓
   already visible?  →  do nothing        ← keeps the common case still
              ↓
   delta  = hiddenBelow > 0 ? hiddenBelow : −hiddenAbove
   offset = clamp(current + delta, 0, contentHeight − containerHeight)
              ↓
   |applied delta| < 1pt ?  →  do nothing  ← kills sub-pixel jitter
              ↓
           scrollTo
```

Two details do most of the work in practice:

- **Nothing moves if the input already fits.** This is what stops the view
  twitching every time the keyboard reports a new frame.
- **The offset is clamped against the content bounds**, and the content is
  extended by `occludedHeight` while the keyboard is open. Without that
  extension the last field in a form is unreachable — there is simply nowhere
  left to scroll to.

An input taller than the remaining space cannot satisfy both edges, so its top
is aligned and the user scrolls to the rest.

### How focus is detected

React Native does not expose "which input is focused" publicly, and **focus
events do not bubble**, so a parent scroll view cannot observe a descendant
gaining focus. Three layers cover it:

1. React Native's internal `TextInputState` module, imported defensively. This
   is what makes the zero-configuration case work.
2. Explicit registration via [`useKeyboardAwareInput()`](#usekeyboardawareinput),
   for the strict API where that module is unreachable.
3. If neither is available, automatic scrolling is skipped and a development
   warning explains why. Nothing throws.

While the keyboard is open, focus moving *between* inputs is detected by a
150ms identity check. No platform event covers this case: iOS emits nothing for
a focus change alone, and on Android API 30+ `ReactRootView` only fires when
keyboard *visibility* changes. The check is a single property read with no
bridge traffic and only runs while the keyboard is visible; disable it with
`trackFocusChanges={false}` if you register inputs yourself.

---

## Troubleshooting

<details>
<summary><b>The keyboard still covers my input on Android</b></summary>

Almost always the navigation-bar inset. Install
`react-native-safe-area-context` and wrap your app in `<SafeAreaProvider>`.

Confirm it with the metrics screen in the example app, or:

```tsx
const { keyboardHeight, occludedHeight } = useKeyboard();
// occludedHeight − keyboardHeight should equal your bottom inset.
// If it is 0 on a gesture-navigation device, the inset is not being resolved.
```

As a stopgap, pass the inset explicitly: `<KeyboardAwareScrollView bottomInset={48} />`.
</details>

<details>
<summary><b>The last field in my form still cannot be reached</b></summary>

Check you have not set `applyKeyboardPadding={false}`, and that nothing
downstream overrides `contentContainerStyle`'s `paddingBottom` with a fixed
value.
</details>

<details>
<summary><b>Android does not resize</b></summary>

Under edge-to-edge it is not supposed to — the system stopped resizing windows
in Android 15 and hands you insets instead. This library does not need the
resize. If layout *elsewhere* in your app depends on it, that code needs
migrating to insets; `useKeyboard().occludedHeight` gives you the number.
</details>

<details>
<summary><b>The input jumps or oscillates while the keyboard opens</b></summary>

Usually a competing keyboard handler. Remove any `KeyboardAvoidingView`,
`keyboard-aware-scroll-view` or `keyboard-controller` wrapper from the same
screen — two libraries adjusting the same layout will fight.

Also check you are not nesting `KeyboardAvoider` around a
`KeyboardAwareScrollView`; the scroll view handles it alone.
</details>

<details>
<summary><b>Nothing happens at all</b></summary>

Focus detection may be unavailable — you will see a development warning saying
so. This happens on React Native's strict API. Attach
[`useKeyboardAwareInput()`](#usekeyboardawareinput) to your inputs.
</details>

<details>
<summary><b>My modal's inputs misbehave</b></summary>

Put the `KeyboardAwareScrollView` *inside* the `Modal`, not around it. Opening
a modal while the keyboard is already up is supported: the library seeds its
state from `Keyboard.isVisible()` when it first subscribes.

Third-party bottom sheets are not tested and not claimed.
</details>

<details>
<summary><b>The first tap on my button does nothing</b></summary>

That is React Native's default `keyboardShouldPersistTaps="never"`. This
library defaults it to `'handled'`; if you set it back to `'never'`, the first
tap only dismisses the keyboard.
</details>

---

## Known limitations

Stated plainly, because finding these out later is worse:

1. **No per-frame keyboard-synced animation on Android.** Requires
   `WindowInsetsAnimationCallback`, which JavaScript cannot reach. Movement is
   animated with a matched duration instead. Use
   `react-native-keyboard-controller` if this matters.
2. **Android keyboard *height changes* are undetectable on API 30+.** React
   Native's `ReactRootView` only emits on visibility changes, so switching to
   the emoji keyboard or a different IME while typing produces no event. iOS
   handles this correctly via `keyboardWillChangeFrame`.
3. **Android API 29 and below** relies on React Native's legacy visible-frame
   heuristic, which is unreliable under edge-to-edge.
4. **No interactive-dismissal tracking on Android.** iOS reports it; Android
   has no equivalent event.
5. **`inverted` FlatLists** keep working but do not auto-scroll.
6. **Third-party bottom sheets are not supported** — not because they cannot
   work, but because they have not been tested, and claiming otherwise would be
   dishonest.

---

## Contributing

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

The geometry is pure and heavily unit-tested — `src/core/normalize.ts` and
`src/core/solver.ts` are the two files worth reading first. Behaviour changes
there should come with a failing test.

There is a ten-screen [example app](./example) covering every keyboard
situation the library handles. A device pass through it is expected before any
release.

## Links

- [Example app](./example) — ten screens, one per keyboard scenario
- [Changelog](./CHANGELOG.md)
- [Report an issue](https://github.com/s3838maske/react-native-smart-keyboard/issues)

## License

[MIT](./LICENSE) © Shubham Maske
