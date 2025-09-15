import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Target, 
  CheckCircle, 
  Play, 
  ArrowLeft,
  Calendar,
  Award,
  FileText,
  Video,
  Download,
  MessageCircle,
  Shield,
  Zap
} from "lucide-react";
import { courseService } from "@/services/course.service";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Course } from "@/types";
import { getImageUrl } from "@/utils/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll in this course');
      navigate('/login');
      return;
    }

    if (!course) return;

    // Redirect to checkout page
    navigate(`/checkout/${course.id}`);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const formatDuration = (duration: string) => {
    return duration || 'Not specified';
  };

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Header Skeleton */}
              <div className="mb-8">
                <Skeleton className="h-8 w-64 mb-4" />
                <Skeleton className="h-6 w-96 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              
              {/* Main Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!course) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
              <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/courses')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-8 overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/courses')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>

            {/* Course Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {course.category}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {course.level}
                    </Badge>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h1>
                  
                  <p className="text-gray-600 text-lg mb-4">
                    {course.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{course.students} students enrolled</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.class} • {course.subject}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start" style={{ minHeight: '100vh' }}>
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6" style={{ minHeight: '100vh' }}>
                {/* Course Thumbnail */}
                {course.thumbnailUrl && getImageUrl(course.thumbnailUrl) && (
                  <Card>
                    <CardContent className="p-0">
                      <img 
                        src={getImageUrl(course.thumbnailUrl)!} 
                        alt={course.title}
                        className="w-full h-64 object-cover rounded-t-lg"
                        onError={(e) => {
                          console.error('Failed to load course thumbnail:', course.thumbnailUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* What You'll Learn */}
                {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        What You'll Learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.whatYouWillLearn.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Course Content */}
                {course.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Course Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: course.content }} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Requirements */}
                {course.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-orange-600" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{course.requirements}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Who This Course Is For */}
                {course.whoIsThisFor && course.whoIsThisFor.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        Who This Course Is For
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {course.whoIsThisFor.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Topics Covered */}
                {course.topics && course.topics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-teal-600" />
                        Topics Covered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {course.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

                             {/* Sidebar */}
               <div className="space-y-6 lg:max-w-sm" style={{ position: 'relative' }}>
                                 {/* Enrollment Card */}
                 <Card className="sticky top-8 will-change-transform" style={{ 
                   position: 'sticky',
                   top: '2rem',
                   zIndex: 10,
                   transform: 'translateZ(0)',
                   backfaceVisibility: 'hidden'
                 }}>
                  <CardHeader>
                    <CardTitle className="text-xl">Enroll in This Course</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {formatPrice(course.price)}
                      </div>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="text-sm text-gray-500 line-through mb-1">
                          {formatPrice(course.originalPrice)}
                        </div>
                      )}
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="text-sm text-green-600 font-medium">
                          Save {formatPrice(course.originalPrice - course.price)}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Video className="h-4 w-4 text-blue-600" />
                        <span>Lifetime access to course content</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Download className="h-4 w-4 text-green-600" />
                        <span>Downloadable resources</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        <span>Community support</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span>Certificate of completion</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleEnroll}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Enroll Now
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      30-Day Money-Back Guarantee
                    </p>
                  </CardContent>
                </Card>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{formatDuration(course.duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Level</span>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{course.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Students</span>
                      <span className="font-medium">{course.students}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructor Info */}
                {course.instructor && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Instructor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {course.instructor.name?.charAt(0) || 'I'}
                        </div>
                        <div>
                          <div className="font-medium">{course.instructor.name}</div>
                          <div className="text-sm text-gray-600">{course.instructor.email}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;
