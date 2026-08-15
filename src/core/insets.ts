import { createContext, useContext, useMemo } from 'react';
import type { Context } from 'react';
import { Dimensions, StatusBar } from 'react-native';

import { IS_ANDROID } from './platform';
import { warnOnce } from './warn';

interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SafeAreaModule {
  SafeAreaInsetsContext?: Context<EdgeInsets | null>;
  initialWindowMetrics?: { insets: EdgeInsets } | null;
}

/**
 * `react-native-safe-area-context` is an *optional* peer dependency.
 *
 * It is the only reliable source of the Android navigation-bar inset, which is
 * required to know how much of the window the keyboard really covers under
 * edge-to-edge (see `normalize.ts`). When it is absent we degrade to a
 * heuristic rather than failing.
 */
let safeAreaModule: SafeAreaModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  safeAreaModule = require('react-native-safe-area-context') as SafeAreaModule;
} catch {
  safeAreaModule = null;
}

/**
 * Stand-in context used when the optional dependency is not installed. Reading
 * a real context unconditionally keeps the hook order identical in both cases,
 * so this never violates the rules of hooks.
 */
const FallbackInsetsContext = createContext<EdgeInsets | null>(null);

const InsetsContext: Context<EdgeInsets | null> =
  safeAreaModule?.SafeAreaInsetsContext ?? FallbackInsetsContext;

/**
 * Best-effort bottom inset when `react-native-safe-area-context` is missing.
 *
 * Comparing the screen and window heights reveals the system bars — but only
 * while the app is *not* edge-to-edge. Under edge-to-edge the window spans the
 * whole screen, so this correctly returns 0 for the layout while the
 * navigation bar still overlays content. That is the known degradation.
 */
function estimateBottomInset(): number {
  if (!IS_ANDROID) {
    return 0;
  }
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const difference = screen.height - window.height - statusBarHeight;
  return difference > 0 ? difference : 0;
}

/**
 * Resolve the bottom safe-area inset, preferring the most accurate source
 * available:
 *
 * 1. an explicit override from props,
 * 2. a live `SafeAreaProvider` above this component,
 * 3. `initialWindowMetrics` (correct, and needs no provider),
 * 4. a screen-versus-window heuristic.
 */
export function useBottomInset(override?: number): number {
  const contextInsets = useContext(InsetsContext);

  return useMemo(() => {
    if (typeof override === 'number' && Number.isFinite(override)) {
      return Math.max(0, override);
    }

    if (contextInsets && Number.isFinite(contextInsets.bottom)) {
      return Math.max(0, contextInsets.bottom);
    }

    const initial = safeAreaModule?.initialWindowMetrics?.insets.bottom;
    if (typeof initial === 'number' && Number.isFinite(initial)) {
      return Math.max(0, initial);
    }

    if (IS_ANDROID && !safeAreaModule) {
      warnOnce(
        'missing-safe-area-context',
        'react-native-safe-area-context is not installed. On Android the keyboard ' +
          'height reported by React Native excludes the navigation bar, so without ' +
          'it the focused input may sit ~24-48pt too low under edge-to-edge. ' +
          'Install it, or pass an explicit `bottomInset` prop.',
      );
    }

    return estimateBottomInset();
  }, [override, contextInsets]);
}

/** Test-only: whether the optional dependency was resolved. */
export function hasSafeAreaContext(): boolean {
  return safeAreaModule != null;
}
