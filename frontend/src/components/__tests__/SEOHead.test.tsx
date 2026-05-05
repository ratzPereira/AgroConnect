import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SEOHead } from '../SEOHead';

describe('SEOHead', () => {
  it('renders title and description meta', () => {
    render(
      <SEOHead
        title="Test Page"
        description="A test description"
        path="/test"
      />,
    );

    expect(document.title).toBe('Test Page');
    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta).not.toBeNull();
    expect(descMeta?.getAttribute('content')).toBe('A test description');
  });

  it('builds canonical URL from path', () => {
    render(
      <SEOHead
        title="Test"
        description="desc"
        path="/requests/5"
      />,
    );

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical?.getAttribute('href')).toContain('/requests/5');
  });

  it('uses absolute ogImage URL when provided', () => {
    render(
      <SEOHead
        title="Test"
        description="desc"
        path="/test"
        ogImage="https://cdn.example.com/photo.jpg"
      />,
    );

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).not.toBeNull();
    expect(ogImage?.getAttribute('content')).toBe('https://cdn.example.com/photo.jpg');
  });

  it('prepends base URL to relative ogImage', () => {
    render(
      <SEOHead
        title="Test"
        description="desc"
        path="/test"
        ogImage="/images/hero.png"
      />,
    );

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).not.toBeNull();
    expect(ogImage?.getAttribute('content')).toContain('/images/hero.png');
    expect(ogImage?.getAttribute('content')).not.toBe('/images/hero.png');
  });

  it('renders JSON-LD script when jsonLd prop is provided', () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AgroConnect',
    };

    render(
      <SEOHead
        title="Test"
        description="desc"
        path="/test"
        jsonLd={jsonLd}
      />,
    );

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script?.textContent).toBe(JSON.stringify(jsonLd));
  });

  it('does not render JSON-LD script when jsonLd prop is not provided', () => {
    render(
      <SEOHead
        title="Test"
        description="desc"
        path="/test"
      />,
    );

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeNull();
  });
});
