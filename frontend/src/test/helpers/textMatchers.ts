import type { MatcherFunction } from '@testing-library/dom';

/**
 * NBSP-aware text matcher for testing-library.
 * The default getByText with a string doesn't reliably match non-breaking
 * spaces (U+00A0) that Intl.NumberFormat emits for pt-PT EUR formatting.
 */
export function textEquals(expected: string): MatcherFunction {
  return (_content, element) => element?.textContent === expected;
}
