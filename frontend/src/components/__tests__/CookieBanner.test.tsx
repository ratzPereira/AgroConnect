import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CookieBanner } from '../CookieBanner';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
  };
});

const mockAccept = vi.fn();
const mockReject = vi.fn();
let mockConsent: 'accepted' | 'rejected' | null = null;

vi.mock('@/stores/cookieStore', () => ({
  useCookieStore: vi.fn(() => ({
    consent: mockConsent,
    accept: mockAccept,
    reject: mockReject,
  })),
}));

describe('CookieBanner', () => {
  beforeEach(() => {
    mockConsent = null;
    vi.clearAllMocks();
  });

  it('shows banner when no consent given', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>);
    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
  });

  it('hides banner when consent is already accepted', () => {
    mockConsent = 'accepted';
    render(<MemoryRouter><CookieBanner /></MemoryRouter>);
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });

  it('calls accept on accept button click', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>);
    fireEvent.click(screen.getByText(/aceitar/i));
    expect(mockAccept).toHaveBeenCalledOnce();
  });

  it('calls reject on reject button click', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>);
    fireEvent.click(screen.getByText(/rejeitar/i));
    expect(mockReject).toHaveBeenCalledOnce();
  });
});
