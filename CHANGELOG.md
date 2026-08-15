# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.1.0] - 2026-08-15

First public release. The version is deliberately `0.x`: the API is complete
and the logic is covered by tests, but the library has not yet been validated
on physical hardware across the device matrix in the README. It will be
promoted to `1.0.0` once that has happened.

### Added

- `KeyboardAwareScrollView` — a `ScrollView` that keeps the focused input
  visible, with `keyboardShouldPersistTaps` defaulted to `"handled"`.
- `KeyboardAwareFlatList` — the same behaviour for `FlatList`, preserving the
  full API including item generics.
- `KeyboardAvoider` — a non-scrolling container that measures how much of
  *itself* the keyboard covers, removing the need for `keyboardVerticalOffset`.
- `KeyboardAwareFooter` — a bottom action bar that rides above the keyboard and
  settles back onto the safe-area inset.
- `useKeyboard()` — normalised keyboard geometry, consistent across platforms.
- `useKeyboardAwareInput()` — opt-in focus registration for projects on React
  Native's strict API, where the internal `TextInputState` module is
  unreachable.

### Fixed at the source

These are long-standing cross-platform inconsistencies the library corrects
before any of its own logic runs:

- Android reports keyboard height with the system bars already subtracted
  (`imeInsets.bottom - barInsets.bottom`), while iOS reports the full height.
  The navigation bar inset is added back so both platforms describe the same
  physical space. Without this, inputs sit roughly 24–48pt too low under
  edge-to-edge, which is mandatory from Android 15.
- Android reports `endCoordinates.screenY` as the bottom of the visible frame,
  not the top of the keyboard as iOS does. Occlusion is derived per-platform
  rather than from a single field.
- Undocked and floating iPad keyboards are ignored, matching the behaviour of
  UIKit's `keyboardLayoutGuide`, instead of causing wild over-scrolling.
- iOS keyboards dragged past the bottom of the window during interactive
  dismissal continue to report occlusion as they leave.

[Unreleased]: https://github.com/s3838maske/react-native-smart-keyboard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/s3838maske/react-native-smart-keyboard/releases/tag/v0.1.0
