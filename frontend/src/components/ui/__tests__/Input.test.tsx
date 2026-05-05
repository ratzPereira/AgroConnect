import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Digite aqui..." />);
    expect(screen.getByPlaceholderText('Digite aqui...')).toBeInTheDocument();
  });

  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="ref test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="custom" />);
    const input = screen.getByPlaceholderText('custom');
    expect(input.className).toContain('custom-class');
  });

  it('shows error message and applies error styling when error prop is provided', () => {
    render(<Input error="Campo obrigatório" placeholder="error test" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('error test');
    expect(input.className).toContain('border-red-300');
  });

  it('renders label when provided', () => {
    render(<Input label="Nome" id="name-input" />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    const label = screen.getByText('Nome');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'name-input');
  });

  it('does not show error styling when no error', () => {
    render(<Input placeholder="no error" />);
    const input = screen.getByPlaceholderText('no error');
    expect(input.className).toContain('border-neutral-300');
    expect(input.className).not.toContain('border-red-300');
  });
});
