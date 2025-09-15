import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, BookOpen, Clock, Download, Star, ArrowRight, Filter, BookText, Lock, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { bookService } from "@/services/book.service"
import { enrollmentService } from "@/services/enrollment.service"
import { useAuth } from "@/contexts/AuthContext"
import { NavBar } from "@/components/NavBar"
import { Footer } from "@/components/Footer"
import { Book } from "@/types"
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

const Books = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    subject: 'all',
    level: 'all',
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

  // Fetch books on component mount and when filters change
  useEffect(() => {
    const fetchBooks = async () => {
      if (!hasAccess) return;

      try {
        setIsLoading(true);
        const response = await bookService.getBooks(currentPage, 12, {
          category: filters.category === 'all' ? undefined : filters.category,
          subject: filters.subject === 'all' ? undefined : filters.subject,
          level: filters.level === 'all' ? undefined : filters.level,
          search: filters.search || undefined
        });
        
        setBooks(response.data);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [currentPage, filters.category, filters.subject, filters.level, filters.search, hasAccess]);

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
                Please log in to access our collection of books and study materials.
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
                To access our books and study materials, you need to purchase at least one course. 
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
              <p className="mt-4 text-muted-foreground">Loading books...</p>
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
              Digital Library
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access a comprehensive collection of educational books, study materials, and resources 
              to enhance your learning journey across all subjects and levels.
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
                  placeholder="Search books by title, author, or description..."
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
                  <SelectItem value="Literature">Literature</SelectItem>
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
                  <SelectItem value="Trigonometry">Trigonometry</SelectItem>
                  <SelectItem value="Mechanics">Mechanics</SelectItem>
                  <SelectItem value="Thermodynamics">Thermodynamics</SelectItem>
                  <SelectItem value="Organic Chemistry">Organic Chemistry</SelectItem>
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

              {/* Filter Button */}
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Books Grid */}
          {books.length === 0 ? (
            <div className="text-center py-16">
              <BookText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or check back later for new books.
              </p>
              <Button onClick={() => {
                setFilters({ category: 'all', subject: 'all', level: 'all', search: '' });
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {books.map((book) => (
                  <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
                    {/* Book Cover */}
                    <div className="relative overflow-hidden rounded-t-lg">
                      {(() => {
                        const imageUrl = getImageUrl(book.coverImageUrl);
                        console.log('🖼️ Book cover debug:', {
                          bookId: book.id,
                          bookTitle: book.title,
                          coverImageUrl: book.coverImageUrl,
                          constructedImageUrl: imageUrl,
                          hasCoverImage: !!book.coverImageUrl,
                          hasConstructedUrl: !!imageUrl
                        });
                        
                        return book.coverImageUrl && imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={book.title}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {
                              console.log('✅ Book cover loaded successfully:', book.coverImageUrl);
                            }}
                            onError={(e) => {
                              console.error('❌ Failed to load book cover:', {
                                originalUrl: book.coverImageUrl,
                                constructedUrl: imageUrl,
                                error: e
                              });
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null;
                      })()}
                      <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center hidden">
                        <BookOpen className="h-20 w-20 text-blue-600" />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={book.isFeatured ? "default" : "secondary"}>
                          {book.isFeatured ? "Featured" : book.status}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        {book.category && (
                          <Badge variant="outline" className={getCategoryColor(book.category)}>
                            {book.category}
                          </Badge>
                        )}
                        {book.level && (
                          <Badge variant="outline" className={getLevelColor(book.level)}>
                            {book.level}
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {book.title}
                      </CardTitle>
                      
                      {book.author && (
                        <p className="text-sm text-muted-foreground">
                          by <span className="font-medium">{book.author}</span>
                        </p>
                      )}
                      
                      <CardDescription className="line-clamp-2">
                        {book.description || book.summary || 'No description available'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3">
                      {/* Book Details */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {book.pages && (
                          <div className="flex items-center gap-2">
                            <BookText className="h-4 w-4" />
                            <span>{book.pages} pages</span>
                          </div>
                        )}
                        
                        {book.publisher && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{book.publisher}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Added recently</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>Popular</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span>{book.downloads} downloads</span>
                        </div>

                        {book.tags && book.tags.length > 0 && (
                          <div className="pt-2">
                            <p className="font-medium text-foreground mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {book.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-semibold text-primary">
                            Free Download
                          </div>
                        </div>
                        
                        <Button asChild className="w-full group">
                          <Link to={`/books/${book.id}`}>
                            <BookOpen className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                            View Details
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white mt-16">
            <h2 className="text-2xl font-bold mb-4">Expand Your Knowledge</h2>
            <p className="text-lg mb-6 opacity-90">
              Access our growing library of educational resources to support your learning journey.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">
                Start Reading Today
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

export default Books;
