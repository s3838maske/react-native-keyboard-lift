import type { FlatListProps, ScrollViewProps, ViewProps } from 'react-native';

/**
 * A rectangle in window coordinates (density-independent points).
 *
 * Window coordinates are used throughout this library rather than screen
 * coordinates, because the relationship between the two differs across
 * platforms (status bar, notch and navigation bar are all handled
 * differently). See `core/normalize.ts`.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Anything that can report its position in window coordinates. Every React
 * Native host component satisfies this, so we depend on the capability rather
 * than on a concrete React Native instance type.
 */
export interface MeasurableNode {
  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void;
}

/**
 * The animation curve the platform uses to move the keyboard.
 *
 * iOS reports a real curve with every keyboard event. Android exposes no
 * equivalent, so `'keyboard'` is reported there — see {@link KeyboardMetrics.duration}.
 */
export type KeyboardEasing =
  | 'easeIn'
  | 'easeInEaseOut'
  | 'easeOut'
  | 'linear'
  | 'keyboard';

/**
 * Keyboard geometry, normalised so that the same numbers mean the same thing
 * on both platforms.
 *
 * React Native's raw keyboard events are *not* directly comparable across
 * platforms:
 *
 * - On Android, `endCoordinates.height` already has the system bars subtracted
 *   (`imeInsets.bottom - barInsets.bottom` in `ReactRootView.java`), while on
 *   iOS it is the full height of the keyboard from the bottom of the screen.
 * - On Android, `endCoordinates.screenY` is the bottom of the *visible frame*,
 *   not the top of the keyboard as it is on iOS.
 *
 * This type resolves both discrepancies.
 */
export interface KeyboardMetrics {
  /** Whether the software keyboard is currently shown. */
  isVisible: boolean;
  /**
   * Height of the keyboard itself, excluding any system navigation bar
   * underneath it. Use this when you want "how tall is the keyboard".
   */
  height: number;
  /**
   * How many points at the bottom of the *window* are covered, including any
   * system navigation bar the keyboard is drawn over. Use this when you are
   * doing layout maths — this is the number that tells you where your usable
   * area ends.
   */
  occludedHeight: number;
  /** Duration of the show/hide animation in milliseconds. */
  duration: number;
  /** Easing curve of the show/hide animation. */
  easing: KeyboardEasing;
}

/** Value returned by {@link useKeyboard}. */
export interface UseKeyboardResult extends KeyboardMetrics {
  /** Alias of {@link KeyboardMetrics.isVisible}, for readability at call sites. */
  isKeyboardVisible: boolean;
  /** Alias of {@link KeyboardMetrics.height}. */
  keyboardHeight: number;
  /** Alias of {@link KeyboardMetrics.duration}. */
  keyboardAnimationDuration: number;
  /** Alias of {@link KeyboardMetrics.easing}. */
  keyboardAnimationEasing: KeyboardEasing;
}

/**
 * How far to move the focused input when it is covered.
 *
 * - `'minimal'` (default) scrolls the smallest distance that fully reveals the
 *   input. This is the least disorienting and avoids gratuitous movement.
 * - `'center'` centres the input in the remaining visible area. Useful for
 *   single-input screens such as an OTP or search field.
 */
export type ScrollBehavior = 'minimal' | 'center';

/** Why an automatic scroll was performed. */
export type ScrollReason = 'focus' | 'keyboard' | 'layout';

/** Payload passed to {@link KeyboardAwareProps.onScrollToInput}. */
export interface ScrollToInputInfo {
  /** React node handle of the input that triggered the scroll, when known. */
  target: number | null;
  /** Scroll offset before the adjustment. */
  from: number;
  /** Scroll offset after the adjustment. */
  to: number;
  /** Measured frame of the focused input, in window coordinates. */
  inputRect: Rect;
  /** What triggered the adjustment. */
  reason: ScrollReason;
}

/**
 * Options shared by every keyboard-aware scrollable container.
 */
export interface KeyboardAwareProps {
  /**
   * Master switch for automatic scrolling. When `false` the container behaves
   * exactly like the component it wraps.
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * Extra breathing room, in points, to leave between the bottom of the
   * focused input and the top of the keyboard.
   *
   * @default 12
   */
  extraSpace?: number;
  /**
   * @deprecated Renamed to {@link KeyboardAwareProps.extraSpace}. Still
   * honoured so that projects migrating from
   * `react-native-keyboard-aware-scroll-view` keep working; it will be removed
   * in a future major version.
   */
  extraScrollHeight?: number;
  /**
   * How far to move the input when it is covered.
   *
   * @default 'minimal'
   */
  scrollBehavior?: ScrollBehavior;
  /**
   * Restore the scroll position when the keyboard hides. Pass `true` to return
   * to the top, or explicit coordinates to return somewhere else.
   *
   * @default false
   */
  resetScrollOnHide?: boolean | { x: number; y: number };
  /**
   * Override the bottom safe-area inset used in keyboard maths. Normally
   * resolved automatically; set this only if you have an unusual layout.
   */
  bottomInset?: number;
  /**
   * While the keyboard is open, extend the scrollable content by the covered
   * height so that inputs near the bottom can actually be scrolled into view.
   *
   * Without this the last field in a form cannot be revealed at all: there is
   * simply nowhere left to scroll to. Turn it off if you already add your own
   * keyboard inset.
   *
   * @default true
   */
  applyKeyboardPadding?: boolean;
  /**
   * Poll for focus changes while the keyboard is open.
   *
   * React Native emits no event when focus moves from one input to another
   * while the keyboard is already open, so a cheap identity check is the only
   * way to notice in pure JavaScript. Disable it if you drive focus changes
   * yourself via {@link useKeyboardAwareInput}.
   *
   * @default true
   */
  trackFocusChanges?: boolean;
  /** Called whenever normalised keyboard geometry changes. */
  onKeyboardChange?: (metrics: KeyboardMetrics) => void;
  /** Called after an automatic scroll has been performed. */
  onScrollToInput?: (info: ScrollToInputInfo) => void;
}

/** Props for `<KeyboardAwareScrollView>`. */
export interface KeyboardAwareScrollViewProps
  extends ScrollViewProps,
    KeyboardAwareProps {}

/** Props for `<KeyboardAwareFlatList>`. */
export interface KeyboardAwareFlatListProps<ItemT>
  extends FlatListProps<ItemT>,
    KeyboardAwareProps {}

/** Props for `<KeyboardAvoider>`. */
export interface KeyboardAvoiderProps extends ViewProps {
  /**
   * Master switch. When `false` the component renders a plain `View`.
   *
   * @default true
   */
  enabled?: boolean;
  /**
   * How the container reacts to the keyboard.
   *
   * - `'padding'` (default) adds bottom padding, leaving layout above intact.
   * - `'translate'` shifts the whole container upwards.
   *
   * Unlike React Native's `KeyboardAvoidingView`, the default is the same on
   * both platforms because the underlying geometry has been normalised first.
   *
   * @default 'padding'
   */
  behavior?: 'padding' | 'translate';
  /** Extra room to leave above the keyboard. @default 0 */
  extraSpace?: number;
  /**
   * Points already excluded from the layout by an ancestor (a bottom tab bar,
   * or a `SafeAreaView`). Subtracted from the applied offset so the container
   * does not double-count space.
   *
   * @default 0
   */
  consumedOffset?: number;
  /** Override the automatically resolved bottom safe-area inset. */
  bottomInset?: number;
}

/** Props for `<KeyboardAwareFooter>`. */
export interface KeyboardAwareFooterProps extends ViewProps {
  /** Master switch. @default true */
  enabled?: boolean;
  /** Extra room to leave above the keyboard. @default 0 */
  extraSpace?: number;
  /**
   * Keep the bottom safe-area inset as padding while the keyboard is hidden,
   * so the footer clears the home indicator / gesture bar.
   *
   * @default true
   */
  applySafeAreaPadding?: boolean;
  /** Override the automatically resolved bottom safe-area inset. */
  bottomInset?: number;
}
