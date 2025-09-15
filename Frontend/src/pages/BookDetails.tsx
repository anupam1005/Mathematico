import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ArrowLeft,
  BookOpen,
  Download,
  Clock,
  User,
  Calendar,
  Tag,
  FileText,
  Star,
  Eye,
  Share2,
  Heart,
  EyeIcon
} from "lucide-react";
import { bookService } from "@/services/book.service";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import SecurePDFViewer from "@/components/SecurePDFViewer";
import { Book } from "@/types";
import { getImageUrl } from "@/utils/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching book with ID:', id);
        const bookData = await bookService.getBookById(id);
        console.log('Book data received:', bookData);
        setBook(bookData);
      } catch (error) {
        console.error('Error fetching book:', error);
        toast.error('Failed to load book details');
        navigate('/books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [id, navigate]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewPDF = async () => {
    if (book?.pdfUrl) {
      // First check if backend is running
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mathematico-backend-new.vercel.app';
        const healthResponse = await fetch(`${backendUrl}/api/v1/health`);
        
        if (!healthResponse.ok) {
          toast.error('Backend server is not running. Please start the server.');
          return;
        }
        
        console.log('Backend is running, opening PDF viewer...');
        setShowPDFViewer(true);
      } catch (error) {
        console.error('Backend health check failed:', error);
        toast.error('Cannot connect to backend server. Please make sure it\'s running.');
      }
    } else {
      toast.error('PDF not available for viewing');
    }
  };

  const getPDFUrl = () => {
    if (book?.pdfUrl) {
      // Use VITE_BACKEND_URL if available, otherwise construct from VITE_API_URL
      const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 
                            import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 
                            'https://mathematico-backend-new.vercel.app';
      
      // Ensure the PDF URL starts with /uploads
      const pdfPath = book.pdfUrl.startsWith('/uploads') ? book.pdfUrl : `/uploads${book.pdfUrl}`;
      const fullUrl = `${backendBaseUrl}${pdfPath}`;
      
      console.log('PDF URL constructed:', fullUrl);
      console.log('Book PDF URL:', book.pdfUrl);
      console.log('Backend Base URL:', backendBaseUrl);
      console.log('PDF Path:', pdfPath);
      
      return fullUrl;
    }
    return '';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book?.title,
          text: book?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-48 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!book) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
              <p className="text-gray-600 mb-6">The book you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/books')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Books
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/books')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Book Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Book Cover */}
                      <div className="flex-shrink-0">
                        {book.coverImageUrl && getImageUrl(book.coverImageUrl) ? (
                          <img 
                            src={getImageUrl(book.coverImageUrl)!} 
                            alt={book.title}
                            className="w-48 h-64 object-cover rounded-lg shadow-lg"
                            onError={(e) => {
                              console.error('Failed to load book cover:', book.coverImageUrl);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                          <BookOpen className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={book.status === 'active' ? 'default' : 'secondary'}>
                              {book.status}
                            </Badge>
                            {book.level && (
                              <Badge variant="outline">{book.level}</Badge>
                            )}
                            {book.isFeatured && (
                              <Badge variant="destructive">Featured</Badge>
                            )}
                          </div>
                          <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                          {book.author && (
                            <p className="text-lg text-gray-600 mb-2">by {book.author}</p>
                          )}
                        </div>

                        {/* Book Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{book.downloads} downloads</span>
                          </div>
                          {book.pages && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{book.pages} pages</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Added {formatDate(book.createdAt)}</span>
                          </div>
                        </div>

                        {/* Free Viewing Badge */}
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-green-600">
                            Free Viewing
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button onClick={handleViewPDF} className="flex-1">
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View PDF
                          </Button>
                          <Button variant="outline" onClick={handleShare}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {book.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {book.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Summary */}
                {book.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {book.summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Table of Contents */}
                {book.tableOfContents && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Table of Contents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {book.tableOfContents}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {book.tags && book.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-orange-600" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {book.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PDF Viewer Modal */}
                {showPDFViewer && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] relative">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">PDF Viewer - {book?.title}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPDFViewer(false)}
                        >
                          Close
                        </Button>
                      </div>
                      <div className="h-[calc(100%-80px)]">
                        <SecurePDFViewer
                          pdfUrl={getPDFUrl()}
                          title={book?.title || 'PDF Document'}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Book Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Book Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {book.isbn && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ISBN</span>
                        <span className="font-medium">{book.isbn}</span>
                      </div>
                    )}
                    
                    {book.publisher && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Publisher</span>
                        <span className="font-medium">{book.publisher}</span>
                      </div>
                    )}
                    
                    {book.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium">{book.category}</span>
                      </div>
                    )}
                    
                    {book.subject && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject</span>
                        <span className="font-medium">{book.subject}</span>
                      </div>
                    )}
                    
                    {book.class && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class</span>
                        <span className="font-medium">{book.class}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={book.status === 'active' ? 'default' : 'secondary'}>
                        {book.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium">{book.isPublished ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* What's Included */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      What's Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span>Secure PDF viewing</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Complete book content</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <span>Table of contents</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span>High-quality formatting</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Creator Info */}
                {book.creator && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Added by
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{book.creator.name}</p>
                          <p className="text-sm text-gray-600">{book.creator.email}</p>
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

export default BookDetails;
