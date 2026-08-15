import { useCallback, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { toEasingFunction } from '../core/easing';
import { useBottomInset } from '../core/insets';
import { useKeyboardOverlap } from '../hooks/useKeyboardOverlap';
import type { KeyboardAwareFooterProps } from '../types';

/**
 * A bottom action bar that rides above the keyboard.
 *
 * Solves the "Continue button hidden behind the keyboard" layout: pin this to
 * the bottom of a flex container and it lifts by exactly the amount the
 * keyboard covers it, then settles back onto the safe-area inset when the
 * keyboard closes.
 *
 * ```tsx
 * <View style={{ flex: 1 }}>
 *   <KeyboardAwareScrollView>
 *     <Form />
 *   </KeyboardAwareScrollView>
 *
 *   <KeyboardAwareFooter>
 *     <Button title="Continue" onPress={submit} />
 *   </KeyboardAwareFooter>
 * </View>
 * ```
 *
 * Pair it with `consumedOffset` on a surrounding `KeyboardAvoider` if you have
 * one, so the two do not both move the same pixels.
 */
export function KeyboardAwareFooter(props: KeyboardAwareFooterProps) {
  const {
    enabled = true,
    extraSpace = 0,
    applySafeAreaPadding = true,
    bottomInset,
    style,
    onLayout,
    children,
    ...viewProps
  } = props;

  const inset = useBottomInset(bottomInset);
  const { overlap, metrics, setViewRef, onLayout: handleOverlapLayout } =
    useKeyboardOverlap({ enabled, extraSpace, consumedOffset: 0, bottomInset });

  const liftAnim = useRef(new Animated.Value(0)).current;
  const paddingAnim = useRef(new Animated.Value(applySafeAreaPadding ? inset : 0)).current;

  const targetPadding = applySafeAreaPadding && !metrics.isVisible ? inset : 0;

  useEffect(() => {
    // Both values are driven together so the lift and the inset release read
    // as a single movement. `useNativeDriver` is off because padding is a
    // layout property; a footer is small enough that this is not a concern.
    const animation = Animated.parallel([
      Animated.timing(liftAnim, {
        toValue: overlap,
        duration: metrics.duration,
        easing: toEasingFunction(metrics.easing),
        useNativeDriver: false,
      }),
      Animated.timing(paddingAnim, {
        toValue: targetPadding,
        duration: metrics.duration,
        easing: toEasingFunction(metrics.easing),
        useNativeDriver: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [
    overlap,
    targetPadding,
    metrics.duration,
    metrics.easing,
    liftAnim,
    paddingAnim,
  ]);

  const composedOnLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      handleOverlapLayout(event);
      onLayout?.(event);
    },
    [handleOverlapLayout, onLayout],
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
      style={[
        style,
        {
          paddingBottom: paddingAnim,
          transform: [{ translateY: Animated.multiply(liftAnim, -1) }],
        },
      ]}
      onLayout={composedOnLayout}
    >
      {children}
    </Animated.View>
  );
}
