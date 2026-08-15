const warned = new Set<string>();

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

/**
 * Emit a development-only warning at most once per key.
 *
 * The library never throws for a condition it can recover from — a missing
 * measurement simply means "skip the automatic scroll" — so warnings are the
 * only channel for telling a developer that something is degraded.
 */
export function warnOnce(key: string, message: string): void {
  if (!isDev() || warned.has(key)) {
    return;
  }
  warned.add(key);
  console.warn(`[react-native-keyboard-lift] ${message}`);
}

/** Test-only: forget which warnings have already been emitted. */
export function resetWarnings(): void {
  warned.clear();
}
