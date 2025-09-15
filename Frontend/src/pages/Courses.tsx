import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, BookOpen, Clock, Users, Star, Play, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { courseService } from "@/services/course.service"
import { NavBar } from "@/components/NavBar"
import { Footer } from "@/components/Footer"
import { Course } from "@/types"
import { getImageUrl } from "@/utils/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    search: ''
  });

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await courseService.getCourses(
          currentPage,
          12,
          {
            category: filters.category === 'all' ? undefined : filters.category,
            level: filters.level === 'all' ? undefined : filters.level,
            search: filters.search || undefined,
          }
        );

        console.log('🖼️ Courses API Response:', response);
        console.log('🖼️ Courses data:', response.data);
        console.log('🖼️ Sample course thumbnailUrl:', response.data[0]?.thumbnailUrl);
        
        setCourses(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [currentPage, filters.category, filters.level, filters.search]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Foundation': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-yellow-100 text-yellow-800',
      'bg-teal-100 text-teal-800'
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₹${price.toLocaleString()}`;
  };

  const formatDuration = (duration: string) => {
    if (!duration) return 'Self-paced';
    return duration;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Courses
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Master mathematics from basics to advanced concepts with our comprehensive, 
              structured learning paths designed by expert educators.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search courses by title, description, or topics..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or check back later for new courses.
              </p>
              <Button onClick={() => {
                setFilters({ category: 'all', level: 'all', search: '' });
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {courses.map((course) => (
                  <Card key={course.id} className="group hover:shadow-lg transition-all duration-300">
                    {/* Course Thumbnail */}
                    <div className="relative overflow-hidden rounded-t-lg">
                      {(() => {
                        const imageUrl = getImageUrl(course.thumbnailUrl);
                        console.log('🖼️ Course thumbnail debug:', {
                          courseId: course.id,
                          courseTitle: course.title,
                          thumbnailUrl: course.thumbnailUrl,
                          constructedImageUrl: imageUrl,
                          hasThumbnail: !!course.thumbnailUrl,
                          hasConstructedUrl: !!imageUrl
                        });
                        
                        return course.thumbnailUrl && imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={course.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', course.thumbnailUrl);
                            }}
                            onError={(e) => {
                              console.error('❌ Failed to load image:', {
                                originalUrl: course.thumbnailUrl,
                                constructedUrl: imageUrl,
                                error: e
                              });
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null;
                      })()}
                      <div className={`w-full h-48 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center ${course.thumbnailUrl ? 'hidden' : ''}`}>
                        <BookOpen className="h-16 w-16 text-primary" />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={course.isFeatured ? "default" : "secondary"}>
                          {course.isFeatured ? "Featured" : course.status}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className={getCategoryColor(course.category)}>
                          {course.category}
                        </Badge>
                        <Badge variant="outline" className={getLevelColor(course.level)}>
                          {course.level}
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                      
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3">
                      {/* Course Details */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(course.duration)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{course.students} students enrolled</span>
                        </div>

                        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                          <div className="pt-2">
                            <p className="font-medium text-foreground mb-1">What you'll learn:</p>
                            <ul className="space-y-1">
                              {course.whatYouWillLearn.slice(0, 2).map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-xs line-clamp-2">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-2xl font-bold text-primary">
                            {formatPrice(course.price)}
                          </div>
                          {course.originalPrice && course.originalPrice > course.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              ₹{course.originalPrice.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        <Button asChild className="w-full group">
                          <Link to={`/courses/${course.id}`}>
                            <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                            View Course
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 text-center text-white mt-16">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of students who are already achieving their academic goals.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Courses;