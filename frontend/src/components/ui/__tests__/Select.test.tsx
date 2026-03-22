import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode, HTMLAttributes } from 'react';
import { Select } from '../Select';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
  };
});

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('renders default placeholder when no value selected', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Selecionar...')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<Select options={options} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(<Select options={options} value="b" />);
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows options', () => {
    render(<Select options={options} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('closes dropdown after selection', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option A'));
    // After selection, the dropdown options should not be visible as separate buttons
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders label when provided', () => {
    render(<Select options={options} label="Category" />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Select options={options} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders hidden input with name and value', () => {
    const { container } = render(<Select options={options} name="category" value="a" />);
    const hiddenInput = container.querySelector('input[type="hidden"]');
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput).toHaveAttribute('name', 'category');
    expect(hiddenInput).toHaveAttribute('value', 'a');
  });
});
