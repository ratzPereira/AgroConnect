import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getMyProfile, isProviderProfile } from '@/api/profile';

/**
 * Redirects provider users with incomplete profiles to the onboarding page.
 * Wraps protected routes that require a complete profile.
 */
export function OnboardingGuard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const isProvider =
    user?.role === 'PROVIDER_MANAGER' ||
    user?.role === 'PROVIDER_LEAD' ||
    user?.role === 'PROVIDER_OPERATOR';

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
    enabled: isProvider,
    staleTime: 5 * 60 * 1000,
  });

  // Don't block while loading
  if (isProvider && isLoading) {
    return <Outlet />;
  }

  // Redirect to onboarding if provider profile is incomplete
  if (
    isProvider &&
    profile &&
    isProviderProfile(profile) &&
    !profile.profileComplete &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
