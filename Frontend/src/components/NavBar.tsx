import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { enrollmentService } from '@/services/enrollment.service';
import { Menu, X, BookOpen, Home, User, Lock } from "lucide-react";
import { ProfileDropdown } from './ProfileDropdown';

type NavItem = {
  name: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
};

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const { isAuthenticated, logout, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check enrollment status
  useEffect(() => {
    const checkEnrollment = async () => {
      if (isAuthenticated && user) {
      try {
        const enrollmentStatus = await enrollmentService.checkEnrollmentStatus();
        // Check if user is admin locally or from API response
        const isAdmin = user?.isAdmin === true || user?.role === 'admin' || enrollmentStatus.isAdmin;
        setHasEnrollment(enrollmentStatus.hasEnrollment || isAdmin);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
        // Fallback: check if user is admin locally
        const isAdmin = user?.isAdmin === true || user?.role === 'admin';
        setHasEnrollment(isAdmin);
      }
      } else {
        setHasEnrollment(false);
      }
    };

    checkEnrollment();
  }, [isAuthenticated, user]);

  // Debug logging
  useEffect(() => {
    console.log('NavBar - Auth State:', {
      isAuthenticated,
      user,
      isLoading,
      userIsAdmin: user?.isAdmin,
      userRole: user?.role,
      hasEnrollment
    });
  }, [isAuthenticated, user, isLoading, hasEnrollment]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Courses', path: '/courses', icon: <BookOpen className="h-5 w-5" /> },
    { 
      name: 'Books', 
      path: '/books', 
      icon: hasEnrollment ? <BookOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />
    },
    { 
      name: 'Live Classes', 
      path: '/live-classes', 
      icon: hasEnrollment ? <BookOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />
    },
    { name: 'Admin', path: '/admin', adminOnly: true },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      const shouldShow = isAuthenticated && (user?.isAdmin === true || user?.role === 'admin');
      console.log('Admin item check:', { 
        item: item.name, 
        shouldShow, 
        userIsAdmin: user?.isAdmin, 
        userRole: user?.role,
        isAuthenticated 
      });
      return shouldShow;
    }
    return true;
  });

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Mathematico</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-4 items-center">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    className="hidden md:inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <span className="sr-only">Open profile menu</span>
                    <User className="block h-6 w-6" aria-hidden="true" />
                  </button>
                  <ProfileDropdown 
                    isOpen={isProfileOpen} 
                    onClose={() => setIsProfileOpen(false)} 
                  />
                </div>
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </div>
                <div className="md:hidden flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </div>
                {/* Mobile menu button for non-authenticated users */}
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === item.path
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
