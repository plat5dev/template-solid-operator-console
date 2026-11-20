/**
 * Combines a static base class string with an optional `@ui-sdk/solid` class prop
 * (which may be a string, array/object ClassValue, or a `(state) => ClassValue` function).
 */
export function cx<S>(base: string, extra?: unknown): (state: S) => unknown {
  return (state: S) => {
    const resolved = typeof extra === "function" ? (extra as (s: S) => unknown)(state) : extra
    return resolved ? [base, resolved] : base
  }
}
