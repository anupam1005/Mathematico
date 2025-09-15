import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Video, Clock, Users, Star, ArrowRight, Calendar, Play, Filter, Lock, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { liveClassService } from "@/services/liveClass.service"
import { enrollmentService } from "@/services/enrollment.service"
import { useAuth } from "@/contexts/AuthContext"
import { NavBar } from "@/components/NavBar"
import { Footer } from "@/components/Footer"
import { LiveClass } from "@/types"
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

const LiveClasses = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    subject: 'all',
    level: 'all',
    status: 'all',
    search: ''
  });

  // Check access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }

      try {
        const enrollmentStatus = await enrollmentService.checkEnrollmentStatus();
        // Check if user is admin locally or from API response
        const isAdmin = user?.isAdmin === true || user?.role === 'admin' || enrollmentStatus.isAdmin;
        setHasAccess(enrollmentStatus.hasEnrollment || isAdmin);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
        // Fallback: check if user is admin locally
        const isAdmin = user?.isAdmin === true || user?.role === 'admin';
        setHasAccess(isAdmin);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, user]);

  // Fetch live classes only if authenticated and has access
  useEffect(() => {
    const fetchLiveClasses = async () => {
      if (!hasAccess) return;

      try {
        setIsLoading(true);
        const response = await liveClassService.getLiveClasses(currentPage, 12, {
          category: filters.category === 'all' ? undefined : filters.category,
          subject: filters.subject === 'all' ? undefined : filters.subject,
          level: filters.level === 'all' ? undefined : filters.level,
          status: filters.status === 'all' ? undefined : filters.status,
          search: filters.search || undefined
        });

        setLiveClasses(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching live classes:', error);
        toast.error('Failed to load live classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveClasses();
  }, [currentPage, filters.category, filters.subject, filters.level, filters.status, filters.search, hasAccess]);

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
    const index = category?.length % colors.length || 0;
    return colors[index];
  };

  const formatPrice = () => {
    return 'Free';
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (scheduledAt: string) => {
    if (!scheduledAt) return false;
    return new Date(scheduledAt) > new Date();
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Checking access...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Access Required</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Please log in to access our live classes and interactive sessions.
              </p>
              <Button onClick={() => navigate('/login')} size="lg">
                Log In
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Purchase Required</h1>
              <p className="text-lg text-muted-foreground mb-8">
                To access our live classes and interactive sessions, you need to purchase at least one course. 
                This gives you unlimited access to all our educational resources.
              </p>
              <div className="space-y-4">
                <Button onClick={() => navigate('/courses')} size="lg" className="w-full sm:w-auto">
                  Browse Courses
                </Button>
                <p className="text-sm text-muted-foreground">
                  Once you purchase a course, you'll have access to all books and live classes.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading live classes...</p>
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
              Live Interactive Classes
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join real-time interactive sessions with expert educators, ask questions, 
              and learn alongside peers in our engaging live classroom environment.
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
                  placeholder="Search live classes by title, description, or topics..."
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
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                </SelectContent>
              </Select>

              {/* Subject Filter */}
              <Select value={filters.subject} onValueChange={(value) => handleFilterChange('subject', value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Algebra">Algebra</SelectItem>
                  <SelectItem value="Calculus">Calculus</SelectItem>
                  <SelectItem value="Geometry">Geometry</SelectItem>
                  <SelectItem value="Mechanics">Mechanics</SelectItem>
                  <SelectItem value="Thermodynamics">Thermodynamics</SelectItem>
                  <SelectItem value="Organic Chemistry">Organic Chemistry</SelectItem>
                  <SelectItem value="Programming">Programming</SelectItem>
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

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live Now</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Button */}
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Live Classes Grid */}
          {liveClasses.length === 0 ? (
            <div className="text-center py-16">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No live classes found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or check back later for new live classes.
              </p>
              <Button onClick={() => {
                setFilters({ category: 'all', subject: 'all', level: 'all', status: 'all', search: '' });
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {liveClasses.map((liveClass) => (
                  <Card key={liveClass.id} className="group hover:shadow-lg transition-all duration-300">
                    {/* Live Class Thumbnail */}
                    <div className="relative overflow-hidden rounded-t-lg">
                      {(() => {
                        const imageUrl = getImageUrl(liveClass.thumbnailUrl);
                        console.log('🖼️ Live Class thumbnail debug:', {
                          liveClassId: liveClass.id,
                          liveClassTitle: liveClass.title,
                          thumbnailUrl: liveClass.thumbnailUrl,
                          constructedImageUrl: imageUrl,
                          hasThumbnail: !!liveClass.thumbnailUrl,
                          hasConstructedUrl: !!imageUrl
                        });
                        
                        return liveClass.thumbnailUrl && imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={liveClass.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {
                              console.log('✅ Live Class image loaded successfully:', liveClass.thumbnailUrl);
                            }}
                            onError={(e) => {
                              console.error('❌ Failed to load live class image:', {
                                originalUrl: liveClass.thumbnailUrl,
                                constructedUrl: imageUrl,
                                error: e
                              });
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null;
                      })()}
                      <div className="w-full h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center hidden">
                        <Video className="h-20 w-20 text-red-600" />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={liveClass.isFeatured ? "default" : "secondary"}>
                          {liveClass.isFeatured ? "Featured" : liveClass.status}
                        </Badge>
                      </div>

                      {/* Live Indicator */}
                      {liveClass.status === 'live' && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-500 text-white animate-pulse">
                            LIVE NOW
                          </Badge>
                        </div>
                      )}

                      {/* Upcoming Indicator */}
                      {isUpcoming(liveClass.scheduledAt || '') && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-500 text-white">
                            UPCOMING
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        {liveClass.category && (
                          <Badge variant="outline" className={getCategoryColor(liveClass.category)}>
                            {liveClass.category}
                          </Badge>
                        )}
                        {liveClass.level && (
                          <Badge variant="outline" className={getLevelColor(liveClass.level)}>
                            {liveClass.level}
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {liveClass.title}
                      </CardTitle>
                      
                      {liveClass.instructor && (
                        <p className="text-sm text-muted-foreground">
                          with <span className="font-medium">{liveClass.instructor.name}</span>
                        </p>
                      )}
                      
                      <CardDescription className="line-clamp-2">
                        {liveClass.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3">
                      {/* Live Class Details */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {liveClass.scheduledAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateTime(liveClass.scheduledAt)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(liveClass.duration)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{liveClass.enrolledStudents}/{liveClass.maxStudents} students</span>
                        </div>

                        {liveClass.topics && liveClass.topics.length > 0 && (
                          <div className="pt-2">
                            <p className="font-medium text-foreground mb-1">Topics:</p>
                            <div className="flex flex-wrap gap-1">
                              {liveClass.topics.slice(0, 3).map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {liveClass.prerequisites && (
                          <div className="pt-2">
                            <p className="font-medium text-foreground mb-1">Prerequisites:</p>
                            <p className="text-xs line-clamp-2">{liveClass.prerequisites}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-2xl font-bold text-primary">
                            {formatPrice()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Live classes are always free
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button asChild className="flex-1 group">
                            <Link to={`/live-classes/${liveClass.id}`}>
                              <Video className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                              Watch Classes
                            </Link>
                          </Button>
                          
                          {liveClass.status === 'live' && liveClass.meetingUrl && (
                            <Button variant="default" size="icon" asChild>
                              <Link to={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
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
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-8 text-center text-white mt-16">
            <h2 className="text-2xl font-bold mb-4">Ready to Join Live Classes?</h2>
            <p className="text-lg mb-6 opacity-90">
              Experience interactive learning with expert educators and fellow students.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">
                Start Learning Live
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

export default LiveClasses;
