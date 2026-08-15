import { Easing } from 'react-native';
import type { EasingFunction } from 'react-native';

import type { KeyboardEasing } from '../types';

/**
 * Approximation of the private curve UIKit animates the keyboard with
 * (`UIViewAnimationCurve` 7). It is not expressible through the public
 * animation curves, so this bezier is the closest usable match and is what the
 * ecosystem has converged on.
 */
const KEYBOARD_BEZIER = Easing.bezier(0.17, 0.59, 0.4, 0.77);

/** Map a reported keyboard curve onto a React Native easing function. */
export function toEasingFunction(easing: KeyboardEasing): EasingFunction {
  switch (easing) {
    case 'easeIn':
      return Easing.in(Easing.ease);
    case 'easeOut':
      return Easing.out(Easing.ease);
    case 'easeInEaseOut':
      return Easing.inOut(Easing.ease);
    case 'linear':
      return Easing.linear;
    case 'keyboard':
      return KEYBOARD_BEZIER;
  }
}
