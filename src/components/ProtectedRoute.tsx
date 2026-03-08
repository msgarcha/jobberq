import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ children, skipOnboardingCheck }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
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
    return <Navigate to="/landing" replace />;
  }

  // Redirect first-time users to onboarding
  if (!skipOnboardingCheck && !settings && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
