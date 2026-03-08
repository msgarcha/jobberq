import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If already logged in, go to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
