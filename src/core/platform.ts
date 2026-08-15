import { Platform } from 'react-native';

/** Narrowed platform identifier used by the geometry layer. */
export type SupportedPlatform = 'ios' | 'android' | 'other';

export const PLATFORM: SupportedPlatform =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other';

export const IS_IOS = PLATFORM === 'ios';
export const IS_ANDROID = PLATFORM === 'android';

/**
 * The keyboard events this library subscribes to.
 *
 * iOS fires `keyboardWillShow` *before* the animation begins and includes the
 * duration and curve, so we can move in step with it. Android has no `will*`
 * events at all — there is no platform primitive behind them — so we take the
 * `did*` pair and animate with a matched duration afterwards.
 */
export const SHOW_EVENT = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
export const HIDE_EVENT = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * iOS additionally reports frame changes for an already-visible keyboard —
 * switching to emoji, or a hardware keyboard being connected.
 *
 * Android has no counterpart: `ReactRootView` only emits when *visibility*
 * flips, so a keyboard that changes height while staying open is invisible to
 * JavaScript.
 */
export const FRAME_CHANGE_EVENT = IS_IOS ? 'keyboardWillChangeFrame' : null;
