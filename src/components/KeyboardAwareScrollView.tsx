import { forwardRef, useCallback, useMemo, useRef } from 'react';
import type { ForwardedRef } from 'react';
import { ScrollView } from 'react-native';

import { withKeyboardPadding } from '../core/contentPadding';
import { useKeyboardAware } from '../hooks/useKeyboardAware';
import type { KeyboardAwareScrollViewProps, MeasurableNode } from '../types';

function assignRef(ref: ForwardedRef<ScrollView>, node: ScrollView | null): void {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

/**
 * A `ScrollView` that keeps the focused input above the keyboard.
 *
 * Drop-in: every `ScrollView` prop is forwarded untouched, and two defaults
 * are improved — `keyboardShouldPersistTaps` becomes `'handled'` so the first
 * tap on a button actually presses it instead of only dismissing the keyboard,
 * and `scrollEventThrottle` is set so scroll position stays accurate.
 *
 * ```tsx
 * <KeyboardAwareScrollView>
 *   <TextInput placeholder="Name" />
 *   <TextInput placeholder="Email" />
 * </KeyboardAwareScrollView>
 * ```
 */
export const KeyboardAwareScrollView = forwardRef<
  ScrollView,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(props, forwardedRef) {
  const {
    // Keyboard-aware options, consumed here rather than forwarded.
    enabled,
    extraSpace,
    extraScrollHeight,
    scrollBehavior,
    resetScrollOnHide,
    bottomInset,
    trackFocusChanges,
    applyKeyboardPadding = true,
    onKeyboardChange,
    onScrollToInput,
    // ScrollView props we need to compose with.
    onScroll,
    onLayout,
    onContentSizeChange,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    scrollEventThrottle = 16,
    ...scrollViewProps
  } = props;

  const scrollRef = useRef<ScrollView | null>(null);

  const setRef = useCallback(
    (node: ScrollView | null): void => {
      scrollRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  const getContainerNode = useCallback(
    (): MeasurableNode | null => scrollRef.current?.getNativeScrollRef() ?? null,
    [],
  );

  const scrollToOffset = useCallback((offset: number, animated: boolean): void => {
    scrollRef.current?.scrollTo({ y: offset, animated });
  }, []);

  const { metrics, handleScroll, handleLayout, handleContentSizeChange } =
    useKeyboardAware({
      enabled,
      extraSpace,
      extraScrollHeight,
      scrollBehavior,
      resetScrollOnHide,
      bottomInset,
      trackFocusChanges,
      onKeyboardChange,
      onScrollToInput,
      getContainerNode,
      scrollToOffset,
    });

  const composedOnScroll = useCallback(
    (event: Parameters<typeof handleScroll>[0]): void => {
      handleScroll(event);
      onScroll?.(event);
    },
    [handleScroll, onScroll],
  );

  const composedOnLayout = useCallback(
    (event: Parameters<typeof handleLayout>[0]): void => {
      handleLayout(event);
      onLayout?.(event);
    },
    [handleLayout, onLayout],
  );

  const composedOnContentSizeChange = useCallback(
    (width: number, height: number): void => {
      handleContentSizeChange(width, height);
      onContentSizeChange?.(width, height);
    },
    [handleContentSizeChange, onContentSizeChange],
  );

  const paddedContentStyle = useMemo(
    () =>
      applyKeyboardPadding && metrics.isVisible
        ? withKeyboardPadding(contentContainerStyle, metrics.occludedHeight)
        : contentContainerStyle,
    [applyKeyboardPadding, metrics.isVisible, metrics.occludedHeight, contentContainerStyle],
  );

  return (
    <ScrollView
      {...scrollViewProps}
      ref={setRef}
      contentContainerStyle={paddedContentStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={composedOnScroll}
      onLayout={composedOnLayout}
      onContentSizeChange={composedOnContentSizeChange}
    />
  );
});
