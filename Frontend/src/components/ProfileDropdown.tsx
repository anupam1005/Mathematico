import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  BookOpen, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  GraduationCap,
  Calendar,
  Clock
} from 'lucide-react';
import { Course } from '@/types';
import { courseService } from '@/services/course.service';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchEnrolledCourses();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchEnrolledCourses = async () => {
    if (!user) return;
    
    try {
      setIsLoadingCourses(true);
      // Use the correct API endpoint for user's enrolled courses
      const response = await api.get('/courses/my-courses');
      setEnrolledCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      // Don't show error toast as this is not critical
      setEnrolledCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {user.name || 'User'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Enrolled Courses</h4>
              <Badge variant="secondary" className="text-xs">
                {enrolledCourses.length}
              </Badge>
            </div>
            
            {isLoadingCourses ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {enrolledCourses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-900 line-clamp-2">
                          {course.title}
                        </h5>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(course.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={course.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs ml-2"
                      >
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No enrolled courses yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    navigate('/courses');
                    onClose();
                  }}
                >
                  Browse Courses
                </Button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="pt-3 border-t">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
