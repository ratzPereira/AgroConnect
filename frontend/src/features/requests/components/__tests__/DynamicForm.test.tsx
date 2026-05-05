import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicForm } from '../DynamicForm';
import type { FormSchema } from '../DynamicForm';

describe('DynamicForm', () => {
  const textSchema: FormSchema = {
    fields: [
      { name: 'soilType', label: 'Tipo de Solo', type: 'text', required: true, placeholder: 'Ex: Argiloso' },
    ],
  };

  const selectSchema: FormSchema = {
    fields: [
      { name: 'treatment', label: 'Tipo de Tratamento', type: 'select', required: true, options: ['Herbicida', 'Fungicida', 'Inseticida'] },
    ],
  };

  const numberSchema: FormSchema = {
    fields: [
      { name: 'depth', label: 'Profundidade', type: 'number', unit: 'cm', required: false },
    ],
  };

  const _mixedSchema: FormSchema = {
    fields: [
      { name: 'soilType', label: 'Tipo de Solo', type: 'text', required: true },
      { name: 'treatment', label: 'Tratamento', type: 'select', options: ['A', 'B'], required: false },
      { name: 'depth', label: 'Profundidade', type: 'number', unit: 'cm', required: false },
    ],
  };

  const defaultOnChange = vi.fn();
  const defaultValues: Record<string, string> = {};

  it('renders text input fields', () => {
    render(<DynamicForm schema={textSchema} values={defaultValues} onChange={defaultOnChange} />);
    const input = screen.getByLabelText(/Tipo de Solo/);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders select fields with options', () => {
    render(<DynamicForm schema={selectSchema} values={defaultValues} onChange={defaultOnChange} />);
    const select = screen.getByLabelText(/Tipo de Tratamento/);
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Selecione...')).toBeInTheDocument();
    expect(screen.getByText('Herbicida')).toBeInTheDocument();
    expect(screen.getByText('Fungicida')).toBeInTheDocument();
    expect(screen.getByText('Inseticida')).toBeInTheDocument();
  });

  it('renders number fields with unit', () => {
    render(<DynamicForm schema={numberSchema} values={defaultValues} onChange={defaultOnChange} />);
    const input = screen.getByLabelText(/Profundidade/);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
    expect(screen.getByText('cm')).toBeInTheDocument();
  });

  it('calls onChange when a text input value changes', () => {
    const onChange = vi.fn();
    render(<DynamicForm schema={textSchema} values={defaultValues} onChange={onChange} />);
    const input = screen.getByLabelText(/Tipo de Solo/);
    fireEvent.change(input, { target: { value: 'Argiloso' } });
    expect(onChange).toHaveBeenCalledWith('soilType', 'Argiloso');
  });

  it('calls onChange when a select value changes', () => {
    const onChange = vi.fn();
    render(<DynamicForm schema={selectSchema} values={defaultValues} onChange={onChange} />);
    const select = screen.getByLabelText(/Tipo de Tratamento/);
    fireEvent.change(select, { target: { value: 'Fungicida' } });
    expect(onChange).toHaveBeenCalledWith('treatment', 'Fungicida');
  });

  it('renders nothing when schema has no fields', () => {
    const { container } = render(
      <DynamicForm schema={{ fields: [] }} values={defaultValues} onChange={defaultOnChange} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders required indicator (*) for required fields', () => {
    render(<DynamicForm schema={textSchema} values={defaultValues} onChange={defaultOnChange} />);
    // The Input component renders label as "Tipo de Solo *" for required fields
    expect(screen.getByText(/Tipo de Solo \*/)).toBeInTheDocument();
  });

  it('displays error messages when provided', () => {
    render(
      <DynamicForm
        schema={selectSchema}
        values={defaultValues}
        onChange={defaultOnChange}
        errors={{ treatment: 'Campo obrigatório' }}
      />,
    );
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });
});
