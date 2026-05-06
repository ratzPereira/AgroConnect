import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="extra-class">Content</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('extra-class');
    expect(card.className).toContain('bg-white');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('exposes button role and tabIndex when clickable', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('triggers onClick on Enter key', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('triggers onClick on Space key', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not trigger onClick on other keys', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders CardHeader with border-bottom styling', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    // CardHeader renders a div wrapping children, the header div has border-b
    const headerText = screen.getByText('Header');
    // The direct parent is the CardHeader div
    const headerDiv = headerText.closest('.border-b') as HTMLElement;
    expect(headerDiv).not.toBeNull();
  });

  it('renders CardBody', () => {
    render(
      <Card>
        <CardBody>Body content</CardBody>
      </Card>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders CardFooter with border-top styling', () => {
    render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
    // CardFooter renders a div wrapping children, the footer div has border-t
    const footerText = screen.getByText('Footer');
    const footerDiv = footerText.closest('.border-t') as HTMLElement;
    expect(footerDiv).not.toBeNull();
  });

  it('renders header, body, and footer together', () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardBody>Main</CardBody>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
