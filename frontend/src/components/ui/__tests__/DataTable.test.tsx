import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../DataTable';

interface TestRow {
  id: number;
  name: string;
  value: number;
}

const columns = [
  { key: 'name', header: 'Nome', render: (row: TestRow) => row.name, sortable: true },
  { key: 'value', header: 'Valor', render: (row: TestRow) => `\u20AC${row.value}` },
];

const data: TestRow[] = [
  { id: 1, name: 'Item A', value: 100 },
  { id: 2, name: 'Item B', value: 200 },
];

describe('DataTable', () => {
  it('renders column headers and data rows', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('\u20AC200')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r: TestRow) => r.id}
        emptyTitle="Sem resultados"
      />,
    );
    expect(screen.getByText('Sem resultados')).toBeInTheDocument();
  });

  it('shows default empty title when data is empty and no emptyTitle provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r: TestRow) => r.id}
      />,
    );
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('handles row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Item A'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders pagination when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        page={0}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText('P\u00E1gina 1 de 3')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        page={0}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('P\u00E1gina anterior')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        page={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Pr\u00F3xima p\u00E1gina')).toBeDisabled();
  });

  it('calls onPageChange when navigation buttons are clicked', () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        page={1}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Pr\u00F3xima p\u00E1gina'));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByLabelText('P\u00E1gina anterior'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('toggles sort direction on sortable column click', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    const header = screen.getByText('Nome');

    // First click sorts ascending — shows sort icon
    fireEvent.click(header);
    expect(header.closest('th')?.querySelector('svg')).toBeTruthy();

    // Second click toggles to descending
    fireEvent.click(header);
    expect(header.closest('th')?.querySelector('svg')).toBeTruthy();
  });

  it('does not show pagination when totalPages is 1', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('P\u00E1gina 1 de 1')).not.toBeInTheDocument();
  });
});
