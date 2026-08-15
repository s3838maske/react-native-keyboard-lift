import type { MeasurableNode, Rect } from '../types';

/**
 * Give up on a measurement after this long. `measureInWindow` invokes its
 * callback asynchronously and simply never calls back for a view that has been
 * detached, which would otherwise leak a pending promise per focus event.
 */
const MEASURE_TIMEOUT_MS = 500;

/**
 * Narrow an unknown value to something measurable.
 *
 * The imperative handles React Native hands back (`getNativeScrollRef`) are
 * typed loosely and differ between `ScrollView` and `FlatList`, so the
 * capability is checked at runtime rather than asserted.
 */
export function asMeasurable(node: unknown): MeasurableNode | null {
  if (
    node != null &&
    typeof (node as MeasurableNode).measureInWindow === 'function'
  ) {
    return node as MeasurableNode;
  }
  return null;
}

/**
 * Promisified `measureInWindow` that resolves to `null` instead of throwing.
 *
 * A view can fail to measure for entirely ordinary reasons — it was unmounted
 * mid-animation, or it is inside a collapsed subtree. Callers treat `null` as
 * "skip the automatic scroll this time", which is always safe.
 */
export function measureInWindow(
  node: MeasurableNode | null | undefined,
): Promise<Rect | null> {
  if (!node || typeof node.measureInWindow !== 'function') {
    return Promise.resolve(null);
  }

  return new Promise<Rect | null>((resolve) => {
    let settled = false;

    const settle = (value: Rect | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };

    const timeoutId = setTimeout(() => settle(null), MEASURE_TIMEOUT_MS);

    // A pending safety timer should never be a reason to keep the process
    // alive. No-op on React Native, where timers are plain numbers.
    (timeoutId as unknown as { unref?: () => void }).unref?.();

    try {
      node.measureInWindow((x, y, width, height) => {
        const valid =
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Number.isFinite(width) &&
          Number.isFinite(height);
        settle(valid ? { x, y, width, height } : null);
      });
    } catch {
      settle(null);
    }
  });
}
