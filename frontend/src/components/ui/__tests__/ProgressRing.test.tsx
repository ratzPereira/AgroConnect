import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('renders SVG element', () => {
    const { container } = render(<ProgressRing value={50} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders two circle elements (track + progress)', () => {
    const { container } = render(<ProgressRing value={50} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });

  it('shows children content (percentage text)', () => {
    render(
      <ProgressRing value={75}>
        <span>75%</span>
      </ProgressRing>,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('applies correct stroke-dashoffset for 0% progress', () => {
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const { container } = render(<ProgressRing value={0} size={size} strokeWidth={strokeWidth} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = progressCircle.getAttribute('stroke-dashoffset');
    // 0% => offset equals full circumference
    expect(Number(offset)).toBeCloseTo(circumference, 1);
  });

  it('applies correct stroke-dashoffset for 100% progress', () => {
    const size = 80;
    const strokeWidth = 6;

    const { container } = render(<ProgressRing value={100} size={size} strokeWidth={strokeWidth} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = progressCircle.getAttribute('stroke-dashoffset');
    // 100% => offset equals 0
    expect(Number(offset)).toBeCloseTo(0, 1);
  });

  it('applies correct stroke-dashoffset for 50% progress', () => {
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const { container } = render(<ProgressRing value={50} size={size} strokeWidth={strokeWidth} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = progressCircle.getAttribute('stroke-dashoffset');
    // 50% => offset equals half circumference
    expect(Number(offset)).toBeCloseTo(circumference * 0.5, 1);
  });

  it('clamps value to max', () => {
    const size = 80;
    const strokeWidth = 6;

    const { container } = render(<ProgressRing value={200} max={100} size={size} strokeWidth={strokeWidth} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const offset = progressCircle.getAttribute('stroke-dashoffset');
    // clamped to 100% => offset equals 0
    expect(Number(offset)).toBeCloseTo(0, 1);
  });
});
