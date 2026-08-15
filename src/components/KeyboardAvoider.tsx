import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { toEasingFunction } from '../core/easing';
import { useKeyboardOverlap } from '../hooks/useKeyboardOverlap';
import type { KeyboardAvoiderProps } from '../types';

/**
 * Moves its children clear of the keyboard, without a scroll view.
 *
 * Three things differ from React Native's `KeyboardAvoidingView`:
 *
 * 1. **It measures itself.** The offset applied is how much of *this view* the
 *    keyboard actually covers, not the whole keyboard height. A view sitting
 *    above a tab bar is left alone, so there is no `keyboardVerticalOffset` to
 *    tune by hand.
 * 2. **One behaviour on both platforms.** The underlying geometry is
 *    normalised first, so `'padding'` is correct on Android too — including
 *    under edge-to-edge, where the reported keyboard height excludes the
 *    navigation bar.
 * 3. **It animates in step with the keyboard**, using the duration and curve
 *    the platform reported rather than a fixed guess.
 *
 * ```tsx
 * <KeyboardAvoider style={{ flex: 1 }}>
 *   <LoginForm />
 * </KeyboardAvoider>
 * ```
 */
export function KeyboardAvoider(props: KeyboardAvoiderProps) {
  const {
    enabled = true,
    behavior = 'padding',
    extraSpace = 0,
    consumedOffset = 0,
    bottomInset,
    style,
    onLayout,
    children,
    ...viewProps
  } = props;

  const { overlap, metrics, setViewRef, onLayout: handleOverlapLayout } =
    useKeyboardOverlap({ enabled, extraSpace, consumedOffset, bottomInset });

  const animatedOffset = useRef(new Animated.Value(0)).current;
  const useNativeDriver = behavior === 'translate';

  useEffect(() => {
    const animation = Animated.timing(animatedOffset, {
      toValue: overlap,
      duration: metrics.duration,
      easing: toEasingFunction(metrics.easing),
      useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [overlap, metrics.duration, metrics.easing, animatedOffset, useNativeDriver]);

  const composedOnLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      handleOverlapLayout(event);
      onLayout?.(event);
    },
    [handleOverlapLayout, onLayout],
  );

  const animatedStyle = useMemo(
    () =>
      behavior === 'translate'
        ? { transform: [{ translateY: Animated.multiply(animatedOffset, -1) }] }
        : { paddingBottom: animatedOffset },
    [behavior, animatedOffset],
  );

  if (!enabled) {
    return (
      <View {...viewProps} style={style} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      {...viewProps}
      ref={setViewRef}
      style={[style, animatedStyle]}
      onLayout={composedOnLayout}
    >
      {children}
    </Animated.View>
  );
}
