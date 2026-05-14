import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SellerInfo } from '../SellerInfo';

vi.mock('lucide-react', () => ({
  Star: ({ className, ...props }: Record<string, unknown>) => (
    <svg data-testid="star-icon" className={className as string} {...props} />
  ),
  MessageCircle: (props: Record<string, unknown>) => <svg data-testid="icon-message" {...props} />,
  ShoppingBag: (props: Record<string, unknown>) => <svg data-testid="icon-shopping" {...props} />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [k: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardBody: ({ children }: { children: React.ReactNode }) => <div data-testid="card-body">{children}</div>,
}));

const defaultProps = {
  sellerName: 'Maria Santos',
  sellerRating: 4.5,
  sellerListingCount: 8,
  onContact: vi.fn(),
};

describe('SellerInfo', () => {
  beforeEach(() => {
    defaultProps.onContact.mockClear();
  });

  it('renders seller name', () => {
    render(<SellerInfo {...defaultProps} />);
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('renders initials as avatar', () => {
    render(<SellerInfo {...defaultProps} />);
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('renders star rating when provided', () => {
    render(<SellerInfo {...defaultProps} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getAllByTestId('star-icon').length).toBe(5);
  });

  it('hides rating when null', () => {
    render(<SellerInfo {...defaultProps} sellerRating={null} />);
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('renders listing count with correct singular form', () => {
    render(<SellerInfo {...defaultProps} sellerListingCount={1} />);
    expect(screen.getByText('1 anúncio')).toBeInTheDocument();
  });

  it('renders listing count with correct plural form', () => {
    render(<SellerInfo {...defaultProps} sellerListingCount={8} />);
    expect(screen.getByText('8 anúncios')).toBeInTheDocument();
  });

  it('calls onContact when button clicked', () => {
    render(<SellerInfo {...defaultProps} />);
    fireEvent.click(screen.getByText('Contactar Vendedor'));
    expect(defaultProps.onContact).toHaveBeenCalledOnce();
  });

  it('renders initials for single-name seller', () => {
    render(<SellerInfo {...defaultProps} sellerName="João" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
