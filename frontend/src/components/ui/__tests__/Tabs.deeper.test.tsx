import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { Tabs } from '../Tabs';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
  };
});

const tabs = [
  { id: 'overview', label: 'Resumo' },
  { id: 'details', label: 'Detalhes' },
  { id: 'history', label: 'Histórico' },
];

describe('Tabs (deeper)', () => {
  it('renders all tab labels', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
  });

  it('selects first tab by default when no defaultValue or value given', () => {
    render(
      <Tabs tabs={tabs}>
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: overview')).toBeInTheDocument();
    const allTabs = screen.getAllByRole('tab');
    expect(allTabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('click on a tab changes selection in uncontrolled mode', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: overview')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Detalhes'));
    expect(screen.getByText('Active: details')).toBeInTheDocument();

    const allTabs = screen.getAllByRole('tab');
    expect(allTabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(allTabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled mode uses value prop and ignores internal state', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Tabs tabs={tabs} value="overview" onChange={onChange}>
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: overview')).toBeInTheDocument();

    // Clicking should call onChange but NOT update internal state (controlled)
    fireEvent.click(screen.getByText('Histórico'));
    expect(onChange).toHaveBeenCalledWith('history');
    // Still shows overview because value prop controls it
    expect(screen.getByText('Active: overview')).toBeInTheDocument();

    // Parent re-renders with new value
    rerender(
      <Tabs tabs={tabs} value="history" onChange={onChange}>
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: history')).toBeInTheDocument();
  });

  it('renders children with active tab ID', () => {
    render(
      <Tabs tabs={tabs} defaultValue="details">
        {(active) => <div data-testid="panel-content">Tab: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByTestId('panel-content')).toHaveTextContent('Tab: details');
  });

  it('ArrowRight moves to next tab', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(screen.getByText('Active: details')).toBeInTheDocument();
  });

  it('ArrowLeft moves to previous tab', () => {
    render(
      <Tabs tabs={tabs} defaultValue="details">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    const secondTab = screen.getAllByRole('tab')[1];
    fireEvent.keyDown(secondTab, { key: 'ArrowLeft' });
    expect(screen.getByText('Active: overview')).toBeInTheDocument();
  });

  it('ArrowRight wraps from last tab to first', () => {
    render(
      <Tabs tabs={tabs} defaultValue="history">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    const lastTab = screen.getAllByRole('tab')[2];
    fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
    expect(screen.getByText('Active: overview')).toBeInTheDocument();
  });

  it('ArrowLeft wraps from first tab to last', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
    expect(screen.getByText('Active: history')).toBeInTheDocument();
  });

  it('sets tabIndex 0 for active tab and -1 for inactive tabs', () => {
    render(
      <Tabs tabs={tabs} defaultValue="details">
        {(active) => <div>{active}</div>}
      </Tabs>,
    );
    const allTabs = screen.getAllByRole('tab');
    expect(allTabs[0]).toHaveAttribute('tabindex', '-1');
    expect(allTabs[1]).toHaveAttribute('tabindex', '0');
    expect(allTabs[2]).toHaveAttribute('tabindex', '-1');
  });

  it('has correct ARIA roles for tablist and tabpanel', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>{active}</div>}
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('non-arrow keys do not change active tab', () => {
    render(
      <Tabs tabs={tabs} defaultValue="overview">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'Enter' });
    expect(screen.getByText('Active: overview')).toBeInTheDocument();
    fireEvent.keyDown(firstTab, { key: 'Tab' });
    expect(screen.getByText('Active: overview')).toBeInTheDocument();
  });
});
