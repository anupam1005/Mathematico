import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Edit, Trash2, Search, Filter, MoreVertical, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { bookService } from "@/services/book.service"
import { Book } from "@/types"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"

// Define book type for the table
type BookTableData = {
  id: string;
  title: string;
  author?: string;
  category?: string;
  subject?: string;
  level?: string;
  status: string;
  isPublished: boolean;
  downloads: number;
  createdAt: string;
};

export default function AdminBooks() {
  const [books, setBooks] = useState<BookTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        toast.error('Please log in to access the admin panel');
        navigate('/login');
        return;
      }
      
      if (!(user?.isAdmin === true || user?.role === 'admin')) {
        toast.error('Admin access required');
        navigate('/');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // Fetch books on component mount
  useEffect(() => {
    if (isAuthenticated && (user?.isAdmin === true || user?.role === 'admin')) {
      const fetchBooks = async () => {
        try {
          setIsLoading(true);
          console.log('Fetching books with filters:', filters);
          const response = await bookService.getAllBooksAdmin(1, 100, filters);
          
          console.log('Books API response:', response);
          
          // Transform the book data to match our table type
          const formattedBooks = response.data.map((book: Book) => {
            const formattedBook: BookTableData = {
              id: book.id,
              title: book.title || 'Untitled Book',
              author: book.author || 'Unknown Author',
              category: book.category || 'Uncategorized',
              subject: book.subject || 'Not Specified',
              level: book.level || 'Foundation',
              status: book.status || 'draft',
              isPublished: book.isPublished || false,
              downloads: book.downloads || 0,
              createdAt: book.createdAt 
                ? new Date(book.createdAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            };
            return formattedBook;
          });
          
          setBooks(formattedBooks);
          console.log('Books state updated, current count:', formattedBooks.length);
        } catch (error) {
          console.error('Error fetching books:', error);
          toast.error('Failed to load books');
        } finally {
          setIsLoading(false);
        }
      };

      fetchBooks();
    }
  }, [filters, isAuthenticated, user]);

  // Refresh books when component becomes visible (e.g., after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && (user?.isAdmin === true || user?.role === 'admin')) {
        console.log('Page became visible, refreshing books...');
        // Re-fetch books when page becomes visible
        const refreshBooks = async () => {
          try {
            setIsLoading(true);
            const response = await bookService.getAllBooksAdmin(1, 100, filters);
            
            console.log('Refresh books response:', response);
            
            const formattedBooks = response.data.map((book: Book) => ({
              id: book.id,
              title: book.title || 'Untitled Book',
              author: book.author || 'Unknown Author',
              category: book.category || 'Uncategorized',
              subject: book.subject || 'Not Specified',
              level: book.level || 'Foundation',
              status: book.status || 'draft',
              isPublished: book.isPublished || false,
              downloads: book.downloads || 0,
              createdAt: book.createdAt 
                ? new Date(book.createdAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            }));
            
            setBooks(formattedBooks);
          } catch (error) {
            console.error('Error refreshing books:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        refreshBooks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filters, isAuthenticated, user]);

  // Monitor books state changes
  useEffect(() => {
    console.log('Books state changed, current count:', books.length);
    console.log('Books data:', books);
  }, [books]);

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(books.map(book => book.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleDelete = (id: string) => {
    setBookToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      await bookService.deleteBook(bookToDelete);
      setBooks(prev => prev.filter(book => book.id !== bookToDelete));
      toast.success('Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    } finally {
      setIsDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  const bulkDelete = async () => {
    try {
      await Promise.all(selectedRows.map(id => bookService.deleteBook(id)));
      setBooks(prev => prev.filter(book => !selectedRows.includes(book.id)));
      setSelectedRows([]);
      toast.success('Books deleted successfully');
    } catch (error) {
      console.error('Error deleting books:', error);
      toast.error('Failed to delete books');
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      await bookService.togglePublishStatus(id, !currentStatus);
      setBooks(prev => prev.map(book => 
        book.id === id 
          ? { ...book, isPublished: !currentStatus, status: !currentStatus ? 'active' : 'draft' }
          : book
      ));
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update book status');
    }
  };

  const handlePushToPublic = async (id: string) => {
    try {
      // First publish the book
      await bookService.togglePublishStatus(id, true);
      
      // Then update the local state
      setBooks(prev => prev.map(book => 
        book.id === id 
          ? { ...book, isPublished: true, status: 'active' }
          : book
      ));
      
      toast.success('Book pushed to public successfully! Students can now see this book.');
    } catch (error) {
      console.error('Error pushing book to public:', error);
      toast.error('Failed to push book to public');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Foundation': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Books Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all your books and educational resources
          </p>
          <p className="mt-1 text-xs text-blue-600">
            💡 Draft books are only visible to admins. Use "Push to Public" to make them available to students.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('Manual refresh requested');
              const refreshBooks = async () => {
                try {
                  setIsLoading(true);
                  const response = await bookService.getAllBooksAdmin(1, 100, filters);
                  
                  console.log('Manual refresh response:', response);
                  
                  const formattedBooks = response.data.map((book: Book) => ({
                    id: book.id,
                    title: book.title || 'Untitled Book',
                    author: book.author || 'Unknown Author',
                    category: book.category || 'Uncategorized',
                    subject: book.subject || 'Not Specified',
                    level: book.level || 'Foundation',
                    status: book.status || 'draft',
                    isPublished: book.isPublished || false,
                    downloads: book.downloads || 0,
                    createdAt: book.createdAt 
                      ? new Date(book.createdAt).toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }));
                  
                  setBooks(formattedBooks);
                  toast.success('Books refreshed successfully');
                } catch (error) {
                  console.error('Error refreshing books:', error);
                  toast.error('Failed to refresh books');
                } finally {
                  setIsLoading(false);
                }
              };
              
              refreshBooks();
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <Button asChild>
            <Link to="/admin/books/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Book
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books..."
              className="w-full bg-background pl-8"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-48">
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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Books Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading books...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === books.length && books.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="h-8 flex items-center gap-1">
                      Title
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Publication Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No books found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(book.id)}
                          onCheckedChange={() => toggleRowSelection(book.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Created {book.createdAt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {book.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getLevelColor(book.level)}>
                          {book.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                            {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {book.isPublished ? (
                              <span className="text-green-600">✓ Published to Public</span>
                            ) : (
                              <span className="text-orange-600">⚠ Draft (Not Visible to Students)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{book.downloads}</TableCell>
                      <TableCell>{book.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {/* Push to Public button for draft books */}
                          {!book.isPublished && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handlePushToPublic(book.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Push to Public
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/admin/books/${book.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handlePublishToggle(book.id, book.isPublished)}>
                                {book.isPublished ? 'Unpublish' : 'Publish'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePushToPublic(book.id)}>
                                Push to Public
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/books/${book.id}/edit`)}>
                                Edit Book
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(book.id)}
                              >
                                Delete Book
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedRows.length} book(s) selected
              </div>
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the book and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
