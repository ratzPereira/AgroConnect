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
  { id: 'tab1', label: 'Tab One' },
  { id: 'tab2', label: 'Tab Two' },
  { id: 'tab3', label: 'Tab Three' },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab1">
        {(active) => <div>Content: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Tab One')).toBeInTheDocument();
    expect(screen.getByText('Tab Two')).toBeInTheDocument();
    expect(screen.getByText('Tab Three')).toBeInTheDocument();
  });

  it('renders content for default active tab', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab1">
        {(active) => <div>Content: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Content: tab1')).toBeInTheDocument();
  });

  it('switches content on tab click', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab1">
        {(active) => <div>Content: {active}</div>}
      </Tabs>,
    );
    fireEvent.click(screen.getByText('Tab Two'));
    expect(screen.getByText('Content: tab2')).toBeInTheDocument();
  });

  it('calls onChange callback', () => {
    const onChange = vi.fn();
    render(
      <Tabs tabs={tabs} defaultValue="tab1" onChange={onChange}>
        {(active) => <div>{active}</div>}
      </Tabs>,
    );
    fireEvent.click(screen.getByText('Tab Three'));
    expect(onChange).toHaveBeenCalledWith('tab3');
  });

  it('uses role="tablist" and role="tab" for accessibility', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab1">
        {(active) => <div>{active}</div>}
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks active tab with aria-selected', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab2">
        {(active) => <div>{active}</div>}
      </Tabs>,
    );
    const allTabs = screen.getAllByRole('tab');
    expect(allTabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(allTabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(allTabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('renders tabpanel with content', () => {
    render(
      <Tabs tabs={tabs} defaultValue="tab1">
        {(active) => <div>Panel: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText('Panel: tab1')).toBeInTheDocument();
  });

  it('supports controlled value', () => {
    const { rerender } = render(
      <Tabs tabs={tabs} value="tab1">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: tab1')).toBeInTheDocument();

    rerender(
      <Tabs tabs={tabs} value="tab3">
        {(active) => <div>Active: {active}</div>}
      </Tabs>,
    );
    expect(screen.getByText('Active: tab3')).toBeInTheDocument();
  });
});
