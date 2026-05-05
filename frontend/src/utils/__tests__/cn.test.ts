import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('merges basic string classes', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('filters out falsy conditional values', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class', undefined, null);
    expect(result).toBe('base-class');
  });

  it('resolves tailwind-merge conflicts (last wins)', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles empty inputs gracefully', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
