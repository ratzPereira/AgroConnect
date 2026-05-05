import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckinButton } from '../CheckinButton';

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((opts: { mutationFn: unknown }) => ({
    mutate: (data: unknown) => {
      mockMutate(data);
      if (typeof opts.mutationFn === 'function') {
        // Allow the mutation function to be called for side-effects in tests
      }
    },
    isPending: false,
    isError: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

vi.mock('@/api/executions', () => ({
  checkinExecution: vi.fn(),
}));

describe('CheckinButton', () => {
  const defaultProps = { executionId: 1, requestId: 10 };

  // Store original geolocation
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true,
    });
  });

  it('renders check-in button', () => {
    render(<CheckinButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: /fazer check-in/i })).toBeInTheDocument();
  });

  it('shows error when geolocation is not supported', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<CheckinButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(
      screen.getByText(/geolocaliza\u00e7\u00e3o n\u00e3o \u00e9 suportada/i),
    ).toBeInTheDocument();
  });

  it('calls getCurrentPosition when clicked with geolocation available', () => {
    const mockGetCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(<CheckinButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('shows locating text while waiting for position', () => {
    const mockGetCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(<CheckinButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    // While getCurrentPosition has not resolved, the button text should update
    // The component sets locating=true before the callback fires
    expect(screen.getByText(/a obter localiza\u00e7\u00e3o/i)).toBeInTheDocument();
  });

  it('shows error on permission denied', async () => {
    const mockGetCurrentPosition = vi.fn(
      (
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) => {
        error({
          code: 1,
          message: 'User denied',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    );
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    });

    render(<CheckinButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(
        screen.getByText(/permiss\u00e3o de localiza\u00e7\u00e3o negada/i),
      ).toBeInTheDocument();
    });
  });
});
