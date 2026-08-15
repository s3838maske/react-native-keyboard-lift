# Example app

Ten screens, each exercising a different keyboard situation. This is where the
library gets validated — the unit tests cover the geometry, but only a real
device tells you whether it *feels* right.

## Running it

```bash
# from the repository root
npm install
npm run build

cd example
npm install
npm run ios      # or: npm run android
```

The example depends on the library via `file:..`, so rebuild the root package
(`npm run build`) after changing library source.

> A simulator is enough for a first look, but the Android navigation-bar and
> edge-to-edge behaviour this library exists to fix only shows up properly on
> real hardware.

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
