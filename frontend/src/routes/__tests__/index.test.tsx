import { describe, it, expect } from 'vitest';
import { router } from '../index';

describe('Router configuration', () => {
  it('exports router configuration', () => {
    expect(router).toBeDefined();
    expect(router.routes).toBeDefined();
    expect(router.routes.length).toBeGreaterThan(0);
  });

  it('has root path route', () => {
    // The root route wraps everything in RootLayout
    const rootRoute = router.routes[0];
    expect(rootRoute).toBeDefined();
    expect(rootRoute.children).toBeDefined();
    // Find the "/" path within children
    const homeRoute = rootRoute.children?.find((r) => r.path === '/');
    expect(homeRoute).toBeDefined();
  });
});
