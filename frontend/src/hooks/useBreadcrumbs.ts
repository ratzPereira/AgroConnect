import { useMatches } from 'react-router-dom';

interface BreadcrumbHandle {
  breadcrumb: string;
}

interface BreadcrumbItem {
  label: string;
  to?: string;
}

function hasBreadcrumb(handle: unknown): handle is BreadcrumbHandle {
  return typeof handle === 'object' && handle !== null && 'breadcrumb' in handle && typeof (handle as BreadcrumbHandle).breadcrumb === 'string';
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const matches = useMatches();

  const crumbs: BreadcrumbItem[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (hasBreadcrumb(match.handle)) {
      const isLast = i === matches.length - 1 || !matches.slice(i + 1).some((m) => hasBreadcrumb(m.handle));
      crumbs.push({
        label: (match.handle as BreadcrumbHandle).breadcrumb,
        to: isLast ? undefined : match.pathname,
      });
    }
  }

  return crumbs;
}
