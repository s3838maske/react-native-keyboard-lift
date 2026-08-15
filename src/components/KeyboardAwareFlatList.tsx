import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ForwardedRef, ReactElement, Ref } from 'react';
import { FlatList } from 'react-native';

import { withKeyboardPadding } from '../core/contentPadding';
import { asMeasurable } from '../core/measure';
import { warnOnce } from '../core/warn';
import { useKeyboardAware } from '../hooks/useKeyboardAware';
import type { KeyboardAwareFlatListProps, MeasurableNode } from '../types';

function assignRef<ItemT>(
  ref: ForwardedRef<FlatList<ItemT>>,
  node: FlatList<ItemT> | null,
): void {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

function KeyboardAwareFlatListInner<ItemT>(
  props: KeyboardAwareFlatListProps<ItemT>,
  forwardedRef: ForwardedRef<FlatList<ItemT>>,
): ReactElement {
  const {
    enabled = true,
    extraSpace,
    extraScrollHeight,
    scrollBehavior,
    resetScrollOnHide,
    bottomInset,
    trackFocusChanges,
    applyKeyboardPadding = true,
    onKeyboardChange,
    onScrollToInput,
    onScroll,
    onLayout,
    onContentSizeChange,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    scrollEventThrottle = 16,
    inverted,
    ...flatListProps
  } = props;

  const listRef = useRef<FlatList<ItemT> | null>(null);

  /**
   * An inverted list flips the meaning of a scroll offset, so the geometry
   * this library solves for no longer describes the rendered layout. Rather
   * than scroll in the wrong direction, automatic scrolling stands down and
   * the list behaves exactly like a plain `FlatList`.
   */
  const autoScrollEnabled = enabled && !inverted;

  useEffect(() => {
    if (inverted) {
      warnOnce(
        'inverted-flatlist',
        'Automatic keyboard scrolling is disabled for `inverted` lists, because ' +
          'an inverted list reverses the meaning of a scroll offset. Every other ' +
          'FlatList behaviour is unaffected.',
      );
    }
  }, [inverted]);

  const setRef = useCallback(
    (node: FlatList<ItemT> | null): void => {
      listRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  const getContainerNode = useCallback(
    (): MeasurableNode | null => asMeasurable(listRef.current?.getNativeScrollRef()),
    [],
  );

  const scrollToOffset = useCallback((offset: number, animated: boolean): void => {
    listRef.current?.scrollToOffset({ offset, animated });
  }, []);

  const { metrics, handleScroll, handleLayout, handleContentSizeChange } =
    useKeyboardAware({
      enabled: autoScrollEnabled,
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
      applyKeyboardPadding && autoScrollEnabled && metrics.isVisible
        ? withKeyboardPadding(contentContainerStyle, metrics.occludedHeight)
        : contentContainerStyle,
    [
      applyKeyboardPadding,
      autoScrollEnabled,
      metrics.isVisible,
      metrics.occludedHeight,
      contentContainerStyle,
    ],
  );

  return (
    <FlatList<ItemT>
      {...flatListProps}
      ref={setRef}
      inverted={inverted}
      contentContainerStyle={paddedContentStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={composedOnScroll}
      onLayout={composedOnLayout}
      onContentSizeChange={composedOnContentSizeChange}
    />
  );
}

/**
 * A `FlatList` that keeps the focused input above the keyboard.
 *
 * The full `FlatList` API is preserved, including item generics:
 *
 * ```tsx
 * <KeyboardAwareFlatList<User>
 *   data={users}
 *   renderItem={({ item }) => <UserRow user={item} />}
 * />
 * ```
 */
export const KeyboardAwareFlatList = forwardRef(KeyboardAwareFlatListInner) as <
  ItemT,
>(
  props: KeyboardAwareFlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> },
) => ReactElement;
