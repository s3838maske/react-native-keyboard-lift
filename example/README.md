# Example app

Ten screens, each exercising a different keyboard situation. This is where the
library gets validated — the unit tests cover the geometry, but only a real
device tells you whether it *feels* right.

The app is Expo SDK 56, which ships React Native 0.85.3 and React 19.2.3 —
exactly the versions the library targets.

## Running it

```bash
# 1. Build the library once, from the repository root
npm install
npm run build

# 2. Start the example
cd example
npm install
npm start
```

Then press `i` for iOS or `a` for Android in the Expo CLI prompt.

Because the library is pure JavaScript, **Expo Go is enough** — there is no
prebuild, no CocoaPods, no Gradle. That is the point of the library, and it is
worth confirming for yourself on the first run.

The library is linked with `file:..` and Metro watches its source, so edits to
`../src` hot-reload. If a change does not appear, restart with `npm run start:clear`.

### On a physical device (recommended)

1. Install **Expo Go** from the App Store or Play Store.
2. Run `npm start` and scan the QR code with the camera (iOS) or the Expo Go
   app (Android).
3. Phone and computer must be on the same network.

Physical hardware is where the Android navigation-bar and edge-to-edge
behaviour this library exists to fix actually shows up.

### As a native build

Only needed if you want to test outside Expo Go:

```bash
npm run prebuild     # generates ios/ and android/
npm run ios          # or: npm run android
```

## ⚠️ Simulator keyboard gotcha

**The iOS Simulator does not show the software keyboard by default** — it
forwards your Mac's hardware keyboard instead, so tapping a field moves the
caret but no keyboard appears and nothing scrolls. This makes the library look
broken when it is not.

Fix it with **`Cmd + K`** (I/O → Keyboard → Toggle Software Keyboard) in the
Simulator, on every fresh simulator.

The Android emulator shows the software keyboard by default, but if you have
typed with your physical keyboard it may hide. Toggle it off in
**Settings → System → Languages & input → Physical keyboard → Use on-screen keyboard**.

## Screens

| # | Screen | What to check |
|---|--------|---------------|
| 1 | Basic form | Zero configuration. No field is ever covered. |
| 2 | Long form | First field does not jump; last field can still be revealed. |
| 3 | Login form | `KeyboardAvoider` lifts by the overlap only — no `keyboardVerticalOffset`. |
| 4 | Registration form | Content grows while the keyboard is open; focus stays put. |
| 5 | FlatList form | Virtualised inputs; header, footer and typed data still work. |
| 6 | Modal form | Modal opened *while the keyboard is already up*. |
| 7 | Bottom action button | Continue button clears both the keyboard and the gesture bar. |
| 8 | Nested scroll containers | Inner scrollers unaffected; only the outer one adjusts. |
| 9 | Safe area & metrics | Live geometry readout — the first place to look when debugging. |
| 10 | Stress test | Rapid focus changes produce exactly one scroll each. |

## Reading the metrics screen

Screen 9 is the diagnostic. `occludedHeight − keyboardHeight` should equal the
bottom safe-area inset:

- **Android** — the difference is the navigation bar. If it reads `0` on a
  gesture-navigation device, `react-native-safe-area-context` is missing or
  there is no `SafeAreaProvider` above the component.
- **iOS** — the difference is the home indicator, typically 34pt on notched
  devices and 0 on older ones.

## Testing priorities

The cases that matter most, in order:

| Priority | Case | Why |
| --- | --- | --- |
| **P0** | Android 15+ (API 35+), gesture navigation | Edge-to-edge is enforced; the whole reason this library exists |
| **P0** | Android 15+, three-button navigation | Different navigation-bar inset |
| **P0** | iPhone with a home indicator | 34pt inset enters the maths |
| **P0** | Last field of the long form | Content-extension behaviour |
| P1 | Android 11–14 | The API 30+ inset path |
| P1 | Modal opened while the keyboard is up | Store seeding from `Keyboard.isVisible()` |
| P1 | Small screen (iPhone SE) | Only a sliver of visible area remains |
| P1 | Stress test | Stale-measurement invalidation |
| P2 | Android 10 or below | Legacy heuristic — known weak |
| P2 | iPad floating / split keyboard | Deliberately ignored, like `keyboardLayoutGuide` |
| P2 | Hardware keyboard, rotation, emoji-keyboard switch | Where the documented limitations live |
