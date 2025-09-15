import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRoutes } from './admin/AdminRoutes';

const Admin = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('Admin component mounted');
    console.log('Current auth state:', { 
      isAuthenticated, 
      userEmail: user?.email, 
      isAdmin: user?.isAdmin, 
      userRole: user?.role,
      isLoading 
    });
    console.log('Current location:', location.pathname);
    
    // Check if user is authenticated and has admin role
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        const redirectPath = location.pathname + location.search;
        console.log('Redirecting to login with path:', redirectPath);
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }

      console.log('User is authenticated, checking admin status');
      console.log('User object:', {
        email: user?.email,
        isAdmin: user?.isAdmin,
        role: user?.role
      });
      
      // Check for admin role (both isAdmin boolean and role string)
      if (!(user?.isAdmin === true || user?.role === 'admin')) {
        console.log('User is not admin, redirecting to home');
        toast.error('Admin access required');
        navigate('/', { replace: true });
        return;
      }

      console.log('User is admin, showing admin panel');
      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, isLoading, navigate, location.pathname]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <AdminRoutes />
    </AdminLayout>
  );
};

export default Admin;