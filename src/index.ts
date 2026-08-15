/**
 * react-native-smart-keyboard
 *
 * Zero-configuration keyboard management for React Native. The public surface
 * is deliberately small — four components and two hooks. Everything else is an
 * implementation detail and may change without a major version.
 */

export { KeyboardAwareScrollView } from './components/KeyboardAwareScrollView';
export { KeyboardAwareFlatList } from './components/KeyboardAwareFlatList';
export { KeyboardAvoider } from './components/KeyboardAvoider';
export { KeyboardAwareFooter } from './components/KeyboardAwareFooter';

export { useKeyboard } from './hooks/useKeyboard';
export { useKeyboardAwareInput } from './hooks/useKeyboardAwareInput';

export type { UseKeyboardOptions } from './hooks/useKeyboard';
export type { KeyboardAwareInputBinding } from './hooks/useKeyboardAwareInput';

export type {
  KeyboardAvoiderProps,
  KeyboardAwareFlatListProps,
  KeyboardAwareFooterProps,
  KeyboardAwareProps,
  KeyboardAwareScrollViewProps,
  KeyboardEasing,
  KeyboardMetrics,
  MeasurableNode,
  Rect,
  ScrollBehavior,
  ScrollReason,
  ScrollToInputInfo,
  UseKeyboardResult,
} from './types';
