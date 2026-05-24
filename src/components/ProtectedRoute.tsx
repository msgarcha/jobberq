import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { isNative } from '@/lib/native/platform';
import TrialExpired from '@/pages/TrialExpired';
import AccessRevoked from '@/pages/AccessRevoked';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
  allowExpired?: boolean;
}

export function ProtectedRoute({ children, skipOnboardingCheck, allowExpired }: ProtectedRouteProps) {
  const { user, loading, subscription, isSuperAdmin } = useAuth();
  const location = useLocation();
  const { data: settings, isLoading: settingsLoading } = useCompanySettings();

  if (loading || (user && !skipOnboardingCheck && settingsLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={isNative() ? '/login' : '/landing'} replace />;
  }

  // Hard gate: revoked accounts can't reach any in-app route
  if (subscription.accessRevoked) {
    return <AccessRevoked />;
  }

  // Trial expired with no subscription — block app routes except billing & this page
  if (
    !subscription.loading &&
    subscription.trialExpired &&
    !subscription.subscribed &&
    !isSuperAdmin &&
    !allowExpired
  ) {
    return <TrialExpired />;
  }

  // Redirect first-time users to onboarding
  if (!skipOnboardingCheck && !settings && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
