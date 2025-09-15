import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Checkout from "./pages/Checkout";
import Books from "./pages/Books";
import BookDetails from "./pages/BookDetails";
import LiveClasses from "./pages/LiveClasses";
import LiveClassDetails from "./pages/LiveClassDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import HelpCenter from "./pages/HelpCenter";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Wrapper component to handle auth state and redirection
const AppRoutes = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get the current path to check if we're on a protected route
  const isProtectedRoute = ['/courses', '/books', '/live-classes'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    // Save the current location they were trying to go to
    const redirectTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  // If user is not authenticated and trying to access admin routes, redirect to login
  if (!isAuthenticated && isAdminRoute) {
    const redirectTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  // If user is authenticated but not admin and trying to access admin routes, redirect to home
  if (isAuthenticated && !user?.isAdmin && isAdminRoute) {
    toast.error('Admin access required');
    return <Navigate to="/" replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && ['/login', '/signup', '/register'].includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // Debug logging
  console.log('AppRoutes - Current state:', {
    pathname: location.pathname,
    isAuthenticated,
    isLoading,
    userEmail: user?.email,
    isAdmin: user?.isAdmin,
    userRole: user?.role
  });

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      
      {/* Protected routes - accessible to all authenticated users */}
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/live-classes" element={<LiveClasses />} />
        <Route path="/live-classes/:id" element={<LiveClassDetails />} />
      </Route>
      
      {/* Admin routes - only accessible to admin users */}
      <Route path="/admin/*" element={<Admin />} />
      
      {/* 404 - Not Found */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
