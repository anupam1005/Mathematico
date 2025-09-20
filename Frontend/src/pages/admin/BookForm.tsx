import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, BookOpen, Upload, X } from 'lucide-react';
import { Book } from '@/types';
import { bookService } from '@/services/book.service';

interface BookFormProps {
  book?: Book;
  isEditing: boolean;
  onSuccess: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ book, isEditing, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    author: string;
    publisher: string;
    category: string;
    subject: string;
    class: string;
    level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
    coverImageUrl: string;
    pdfUrl: string;
    pages: string;
    isbn: string;
    status: 'draft' | 'active' | 'archived';
    isPublished: boolean;
    isFeatured: boolean;
    tags: string;
    tableOfContents: string;
    summary: string;
  }>({
    title: '',
    slug: '',
    description: '',
    author: '',
    publisher: '',
    category: '',
    subject: '',
    class: '',
    level: 'Foundation',
    coverImageUrl: '',
    pdfUrl: '',
    pages: '',
    isbn: '',
    status: 'draft',
    isPublished: false,
    isFeatured: false,
    tags: '',
    tableOfContents: '',
    summary: ''
  });

  useEffect(() => {
    if (book && isEditing) {
      setFormData({
        title: book.title || '',
        slug: book.slug || '',
        description: book.description || '',
        author: book.author || '',
        publisher: book.publisher || '',
        category: book.category || '',
        subject: book.subject || '',
        class: book.class || '',
        level: book.level || 'Foundation',
        coverImageUrl: book.coverImageUrl || '',
        pdfUrl: book.pdfUrl || '',
        pages: book.pages?.toString() || '',
        isbn: book.isbn || '',
        status: book.status || 'draft',
        isPublished: book.isPublished || false,
        isFeatured: book.isFeatured || false,
        tags: book.tags?.join(', ') || '',
        tableOfContents: book.tableOfContents || '',
        summary: book.summary || ''
      });
      
      // Set existing file previews
      if (book.coverImageUrl) {
        setCoverImagePreview(book.coverImageUrl);
      }
    }
  }, [book, isEditing]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }
      
      if (file.type.startsWith('image/')) {
        setCoverImageFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        toast.success('Cover image selected successfully');
      } else {
        toast.error('Please select a valid image file (JPEG, PNG, GIF)');
        e.target.value = '';
      }
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB for PDFs)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('PDF size should be less than 10MB');
        e.target.value = '';
        return;
      }
      
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        toast.success('PDF file selected successfully');
      } else {
        toast.error('Please select a valid PDF file');
        e.target.value = '';
      }
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview('');
  };

  const removePdf = () => {
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    

    setLoading(true);
    
    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('slug', formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      formDataToSend.append('description', formData.description);
      formDataToSend.append('author', formData.author);
      formDataToSend.append('publisher', formData.publisher);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('class', formData.class);
      formDataToSend.append('level', formData.level);
      formDataToSend.append('pages', formData.pages);
      formDataToSend.append('isbn', formData.isbn);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('isPublished', formData.isPublished.toString());
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('tableOfContents', formData.tableOfContents);
      formDataToSend.append('summary', formData.summary);

      // Add files if they exist
      if (coverImageFile) {
        formDataToSend.append('coverImage', coverImageFile);
      }
      if (pdfFile) {
        formDataToSend.append('pdf', pdfFile);
      }

      if (isEditing && id) {
        await bookService.updateBook(id, formDataToSend);
        toast.success('Book updated successfully');
      } else {
        await bookService.createBook(formDataToSend);
        toast.success('Book created successfully! Go to Books management and click "Push to Public" to make it visible to students.');
      }

      onSuccess();
      navigate('/admin/books');
    } catch (error: any) {
      console.error('Book operation failed:', error);
      
      // Handle specific error types
      if (error.message?.includes('Network error')) {
        toast.error('Network error. Please check your internet connection and ensure the backend server is running.');
      } else if (error.message?.includes('401')) {
        toast.error('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else if (error.message?.includes('403')) {
        toast.error('Access denied. You do not have permission to perform this action.');
      } else if (error.message?.includes('404')) {
        toast.error('Book endpoint not found. Please check if the backend server is running correctly.');
      } else if (error.message?.includes('500')) {
        toast.error('Server error. Please try again later or contact support.');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to save book. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/books');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Book' : 'Create New Book'}
          </h1>
        </div>
        {!isEditing && (
          <p className="text-sm text-muted-foreground ml-8">
            📝 Book will be saved as draft. Use "Push to Public" button in Books management to make it visible to students.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Book Details
              {isEditing && (
                <Badge variant="secondary" className="ml-2">
                  Editing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Enter author name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter book description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="e.g., Mathematics, Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="e.g., Algebra, Physics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  placeholder="e.g., Class 10, Class 12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: any) => handleInputChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => handleInputChange('publisher', e.target.value)}
                  placeholder="Enter publisher name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Content & Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="space-y-2">
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="cursor-pointer"
                  />
                  {coverImagePreview && (
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeCoverImage}
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfFile">PDF File</Label>
                <div className="space-y-2">
                  <Input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="cursor-pointer"
                  />
                  {pdfFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{pdfFile.name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removePdf}
                        className="w-6 h-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  value={formData.pages}
                  onChange={(e) => handleInputChange('pages', e.target.value)}
                  placeholder="Number of pages"
                  type="number"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  placeholder="ISBN number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleInputChange('tags', '')}
                    title="Clear tags"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief summary of the book"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableOfContents">Table of Contents</Label>
              <Textarea
                id="tableOfContents"
                value={formData.tableOfContents}
                onChange={(e) => handleInputChange('tableOfContents', e.target.value)}
                placeholder="Table of contents or chapter outline"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Published</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isPublished" className="text-sm">
                    Make book available to students
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Featured</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isFeatured" className="text-sm">
                    Show in featured section
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('Auth Debug - BookForm:');
              console.log('Token:', localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
              console.log('User:', localStorage.getItem('user') || sessionStorage.getItem('user'));
              toast.info('Debug info logged to console');
            }}
          >
            Debug Auth
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : (isEditing ? 'Update Book' : 'Create Book')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;
