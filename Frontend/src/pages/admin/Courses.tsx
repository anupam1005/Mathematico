import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Edit, Trash2, Search, Filter, MoreVertical, ArrowUpDown, BookOpen, Globe } from "lucide-react"
import { toast } from "sonner"
import { courseService } from "@/services/course.service"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Define course type for the table
type CourseTableData = {
  id: string;
  title: string;
  category: string;
  class: string;
  subject: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert' | string;
  students: number;
  price: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<CourseTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const userIsAdmin = user?.isAdmin || false;

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Check authentication first
        if (!isAuthenticated) {
          toast.error('Please log in to access the admin panel');
          navigate('/login');
          return;
        }

        if (!userIsAdmin) {
          toast.error('Admin access required');
          navigate('/');
          return;
        }

        setIsLoading(true);
        console.log('Fetching admin courses...');
        const response = await courseService.getAllCoursesAdmin();
        console.log('Admin courses response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data is array:', Array.isArray(response.data));
        console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
        
        // Ensure we have an array of courses
        if (!Array.isArray(response.data)) {
          console.error('Response data is not an array:', response.data);
          console.error('Response structure:', JSON.stringify(response, null, 2));
          throw new Error('Invalid response format: expected array of courses');
        }
        
        // Transform the course data to match our table type
        const formattedCourses = response.data.map((course: any) => {
          console.log('Processing course:', course);
          // Ensure all required fields have default values
          const formattedCourse: CourseTableData = {
            id: course.id || `course-${Math.random().toString(36).substr(2, 9)}`,
            title: course.title || 'Untitled Course',
            category: course.category || 'Uncategorized',
            class: course.class || 'Not Specified',
            subject: course.subject || 'Not Specified',
            level: course.level || 'Foundation',
            students: typeof course.students === 'number' ? course.students : 0,
            price: course.price || 0,
            status: course.status || 'draft',
            createdAt: course.createdAt 
              ? new Date(course.createdAt).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          };
          return formattedCourse;
        });
        
        console.log('Formatted courses:', formattedCourses);
        setCourses(formattedCourses);
      } catch (error) {
        console.error('Error fetching admin courses:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
          response: (error as any)?.response || 'No response'
        });
        
        // Handle authentication errors
        if (error instanceof Error && error.message === 'Authentication required') {
          navigate('/login');
          return;
        }
        
        toast.error('Failed to load courses');
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, userIsAdmin, navigate]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(courses.map(course => course.id));
    } else {
      setSelectedRows([]);
    }
  }

  const handleDeleteCourse = (id: string) => {
    setCourseToDelete(id);
    setIsDeleteDialogOpen(true);
  }

  const handlePublishCourse = async (courseId: string, shouldPublish: boolean) => {
    try {
      await courseService.publishCourse(courseId, shouldPublish);
      
      // Update the local state
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, status: shouldPublish ? 'active' : 'draft' }
          : course
      ));
      
      const action = shouldPublish ? 'published' : 'unpublished';
      toast.success(`Course ${action} successfully!`);
    } catch (error) {
      console.error('Error publishing course:', error);
      const message = (error as any)?.response?.data?.message || 'Failed to update course publish status';
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      await courseService.deleteCourse(courseToDelete);
      setCourses(prev => prev.filter(course => course.id !== courseToDelete));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  }

  const handleEditCourse = (id: string) => {
    console.log('Edit button clicked for course ID:', id);
    console.log('Navigating to:', `/admin/courses/${id}/edit`);
    navigate(`/admin/courses/${id}/edit`);
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show admin access required message
  if (!userIsAdmin) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin access is required to view this page.</p>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">Manage your course catalog</p>
        </div>
        <Button onClick={() => navigate('/admin/courses/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Quick Actions</h3>
            <p className="text-xs text-blue-700 mt-1">
              View your courses on the main website or manage them here
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              <BookOpen className="mr-1.5 h-3 w-3" />
              View on Website
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <Globe className="mr-1.5 h-3 w-3" />
              Homepage
            </a>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === courses.length && courses.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Price (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(course.id)}
                    onCheckedChange={() => toggleRowSelection(course.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category}</TableCell>
                <TableCell>{course.class}</TableCell>
                <TableCell>{course.subject}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.level === 'Foundation' ? 'bg-green-100 text-green-800' :
                    course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    course.level === 'Advanced' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.level}
                  </span>
                </TableCell>
                <TableCell>{course.students}</TableCell>
                <TableCell>₹{course.price.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.status === 'active' ? 'bg-green-100 text-green-800' :
                    course.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.status}
                  </span>
                </TableCell>
                <TableCell>{course.createdAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditCourse(course.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handlePublishCourse(course.id, course.status !== 'active')}
                        className={course.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                      >
                        {course.status === 'active' ? 'Unpublish' : 'Publish'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
