import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
  showLoading?: boolean;
}

const ProtectedRoute = ({
  children,
  requiredRoles = [],
  redirectTo = '/',
  showLoading = true,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', {
      pathname: location.pathname,
      isAuthenticated,
      isLoading,
      userEmail: user?.email,
      isAdmin: user?.isAdmin,
      userRole: user?.role,
      requiredRoles
    });
  }, [location.pathname, isAuthenticated, isLoading, user, requiredRoles]);

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const redirectPath = location.pathname + location.search;
      console.log('User not authenticated, redirecting to login with redirect:', redirectPath);
      navigate(
        `/login?redirect=${encodeURIComponent(redirectPath)}`,
        { replace: true }
      );
      return;
    }

    // If no roles required, allow access for any authenticated user
    if (requiredRoles.length === 0) {
      console.log('No roles required, allowing access for authenticated user');
      setIsAuthorized(true);
      return;
    }

    // Check for admin role (both isAdmin boolean and role string)
    if (requiredRoles.includes('admin') && (user?.isAdmin === true || user?.role === 'admin')) {
      console.log('User is admin, allowing access');
      setIsAuthorized(true);
      return;
    }

    // If we get here, user is authenticated but not authorized
    console.log('User not authorized for this route');
    toast.error('You do not have permission to access this page');
    navigate(redirectTo, { replace: true });
    setIsAuthorized(false);
  }, [isAuthenticated, isLoading, user, requiredRoles, redirectTo, navigate, location]);

  // Show loading state
  if (isLoading || isAuthorized === null) {
    return showLoading ? (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 w-8 animate-spin text-primary" />
      </div>
    ) : null;
  }

  // If not authorized, don't render anything (redirect will happen in useEffect)
  if (!isAuthorized) {
    return null;
  }

  // If we get here, user is authorized
  console.log('User authorized, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
