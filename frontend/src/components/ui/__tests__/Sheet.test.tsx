import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode, HTMLAttributes } from 'react';
import { Sheet } from '../Sheet';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, onClick, ...props }: HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) => (
        <div {...props} onClick={onClick}>
          {children}
        </div>
      ),
    },
  };
});

describe('Sheet', () => {
  it('renders children when open', () => {
    render(
      <Sheet open={true} onClose={vi.fn()}>
        Sheet content
      </Sheet>,
    );
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Sheet open={false} onClose={vi.fn()}>
        Sheet content
      </Sheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Sheet open={true} onClose={vi.fn()} title="Sheet Title">
        Content
      </Sheet>,
    );
    expect(screen.getByText('Sheet Title')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} onClose={onClose} title="Title">
        Content
      </Sheet>,
    );
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} onClose={onClose}>
        Content
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders dialog with aria-modal', () => {
    render(
      <Sheet open={true} onClose={vi.fn()} title="Accessible Sheet">
        Content
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Accessible Sheet');
  });
});
