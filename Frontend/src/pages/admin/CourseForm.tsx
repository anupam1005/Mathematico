import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { courseService, type CourseLevel, type CourseStatus } from '@/services/course.service';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';

// Add JSX namespace for TypeScript
import React from 'react';

// Define form schema with zod
const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  class: z.string().min(1, 'Class is required'),
  subject: z.string().min(1, 'Subject is required'),
  level: z.enum(['Foundation', 'Intermediate', 'Advanced', 'Expert']),
  status: z.enum(['draft', 'active', 'archived']),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  originalPrice: z.coerce.number().min(0, 'Original price cannot be negative').optional(),
  duration: z.string().min(1, 'Duration is required'),
  isFeatured: z.boolean().default(false),
  thumbnailUrl: z.union([z.string(), z.undefined()]).optional(),
  thumbnailFile: z.any().optional(), // File object for upload
  content: z.string().min(1, 'Content is required'),
  requirements: z.string().min(1, 'Requirements are required'),
  whatYouWillLearn: z.array(z.object({
    id: z.string(),
    value: z.string().min(1, 'Learning point cannot be empty')
  })).min(1, 'At least one learning point is required'),
  whoIsThisFor: z.array(z.object({
    id: z.string(),
    value: z.string().min(1, 'Target audience cannot be empty')
  })).min(1, 'At least one target audience is required'),
  topics: z.array(z.object({
    id: z.string(),
    value: z.string().min(1, 'Topic cannot be empty')
  })).min(1, 'At least one topic is required'),
  students: z.coerce.number().min(0, 'Student count cannot be negative').optional(),
}).refine((data) => {
  // Ensure at least one topic has a value
  return data.topics.some(topic => topic.value.trim() !== '');
}, {
  message: "At least one topic must have content",
  path: ["topics"]
});

// Define form values type using zod inference
type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: Partial<Course>;
  isEditing?: boolean;
  onSuccess?: () => void;
}

// Categories data - would typically come from an API
const categories = [
  { id: 'jee', name: 'JEE' },
  { id: 'cbse', name: 'CBSE' },
  { id: 'icse', name: 'ICSE' },
  { id: 'olympiad', name: 'Olympiad' },
] as const;

// Class options
const classOptions = [
  { id: 'class8', name: 'Class 8' },
  { id: 'class9', name: 'Class 9' },
  { id: 'class10', name: 'Class 10' },
  { id: 'class11', name: 'Class 11' },
  { id: 'class12', name: 'Class 12' },
  { id: 'bsc-general', name: 'BSC General' },
  { id: 'btech', name: 'B.Tech' },
  { id: 'cat', name: 'CAT' },
] as const;

// Subject options
const subjectOptions = [
  { id: 'mathematics', name: 'Mathematics' },
  { id: 'physics', name: 'Physics' },
] as const;

export function CourseForm({ course: initialCourse, isEditing = false, onSuccess }: CourseFormProps): React.JSX.Element {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | undefined>(undefined);
  const courseId = params.id;
  const { isAuthenticated, user } = useAuth();
  const userIsAdmin = user?.isAdmin || false;
  

  
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: initialCourse?.title ?? '',
      slug: initialCourse?.slug ?? '',
      description: initialCourse?.description ?? '',
      category: initialCourse?.category ?? '',
      class: initialCourse?.class ?? '',
      subject: initialCourse?.subject ?? '',
      level: (initialCourse?.level as CourseLevel) ?? 'Foundation',
      price: initialCourse?.price ?? 0,
      originalPrice: initialCourse?.originalPrice ?? 0,
      duration: initialCourse?.duration ?? '',
      status: (initialCourse?.status as CourseStatus) ?? 'draft',
      isFeatured: initialCourse?.isFeatured ?? false,
        thumbnailUrl: initialCourse?.thumbnailUrl || undefined,
        thumbnailFile: undefined,
      content: initialCourse?.content ?? '',
      requirements: initialCourse?.requirements ?? '',
      whatYouWillLearn: Array.isArray(initialCourse?.whatYouWillLearn) && initialCourse.whatYouWillLearn.length > 0 
        ? initialCourse.whatYouWillLearn.map((item: string) => ({
            id: `item-${Math.random().toString(36).substr(2, 9)}`,
            value: item
          }))
        : [{ id: `item-${Math.random().toString(36).substr(2, 9)}`, value: 'Learn fundamental concepts' }],
      whoIsThisFor: Array.isArray(initialCourse?.whoIsThisFor) && initialCourse.whoIsThisFor.length > 0
        ? initialCourse.whoIsThisFor.map((item: string) => ({
            id: `item-${Math.random().toString(36).substr(2, 9)}`,
            value: item
          }))
        : [{ id: `item-${Math.random().toString(36).substr(2, 9)}`, value: 'Students preparing for exams' }],
      topics: Array.isArray(initialCourse?.topics) && initialCourse.topics.length > 0
        ? initialCourse.topics.map((item: string) => ({
            id: `item-${Math.random().toString(36).substr(2, 9)}`,
            value: item
          }))
        : [{ id: `topic-${Math.random().toString(36).substr(2, 9)}`, value: 'Introduction to the subject' }],
      students: typeof initialCourse?.students === 'number' ? initialCourse.students : 0,
    },
    mode: 'onChange',
  });

  // Field arrays for dynamic form fields
  const { 
    fields: whatYouWillLearnFields, 
    append: appendWhatYouWillLearn,
    remove: removeWhatYouWillLearn
  } = useFieldArray({
    control: form.control,
    name: 'whatYouWillLearn',
  });

  const { 
    fields: whoIsThisForFields,
    append: appendWhoIsThisFor,
    remove: removeWhoIsThisFor
  } = useFieldArray({
    control: form.control,
    name: 'whoIsThisFor',
  });

  const { 
    fields: topicsFields,
    append: appendTopic,
    remove: removeTopic
  } = useFieldArray({
    control: form.control,
    name: 'topics',
  });

  // Helper function to convert string array to field array format
  const toFieldArray = (items?: string[] | Array<{id: string, value: string}>): Array<{id: string, value: string}> => {
    if (!items) return [{ id: `item-${Math.random().toString(36).substr(2, 9)}`, value: '' }];
    
    if (Array.isArray(items) && items.length > 0) {
      // If it's already in the correct format, return as is
      if (typeof items[0] === 'object' && 'id' in items[0] && 'value' in items[0]) {
        return items as Array<{id: string, value: string}>;
      }
      // If it's an array of strings, convert to field array format
      return (items as string[]).map(item => ({
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        value: item
      }));
    }
    
    // Default to one empty field
    return [{ id: `item-${Math.random().toString(36).substr(2, 9)}`, value: '' }];
  };

  // Handler for image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Validate file size (max 10MB for file upload)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Store the file for form submission
      form.setValue('thumbnailFile', file, { shouldValidate: true });
      
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file);
      setCurrentThumbnail(previewUrl);
      toast.success('Image selected successfully!');
    }
  };

  // Handler for removing thumbnail
  const handleRemoveThumbnail = () => {
    try {
      form.setValue('thumbnailUrl', undefined, { shouldValidate: true });
      form.setValue('thumbnailFile', undefined, { shouldValidate: true });
      setCurrentThumbnail(undefined);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      toast.success('Thumbnail removed');
    } catch (error) {
      console.error('Error removing thumbnail', error);
      toast.error('Failed to remove thumbnail');
    }
  };

  // Handle adding new learning points
  const addWhatYouWillLearnItem = () => {
    appendWhatYouWillLearn({ 
      id: `item-${Math.random().toString(36).substr(2, 9)}`, 
      value: '' 
    });
  };

  // Handle removing learning points
  const removeWhatYouWillLearnItem = (index: number) => {
    if (whatYouWillLearnFields.length > 1) {
      removeWhatYouWillLearn(index);
    } else {
      toast.warning('At least one learning point is required');
    }
  };

  // Handle adding new target audience items
  const addWhoIsThisForItem = () => {
    appendWhoIsThisFor({
      id: `item-${Math.random().toString(36).substr(2, 9)}`,
      value: ''
    });
  };

  // Handle removing target audience items
  const removeWhoIsThisForItem = (index: number) => {
    if (whoIsThisForFields.length > 1) {
      removeWhoIsThisFor(index);
    } else {
      toast.warning('At least one target audience is required');
    }
  };

  // Handle adding new topics
  const addTopicItem = () => {
    appendTopic({ 
      id: `topic-${Math.random().toString(36).substr(2, 9)}`, 
      value: '' 
    });
  };

  // Handle removing topics
  const removeTopicItem = (index: number) => {
    if (topicsFields.length > 1) {
      removeTopic(index);
    } else {
      toast.warning('At least one topic is required');
    }
  };

  // Form submission handler
  const handleSubmit = async (formData: CourseFormValues) => {
    try {
      // Check authentication before submission
      if (!isAuthenticated) {
        toast.error('Please log in to perform this action');
        navigate('/login');
        return;
      }

      if (!userIsAdmin) {
        toast.error('Admin access required to perform this action');
        navigate('/');
        return;
      }

      setIsLoading(true);
      
      // Prepare course data for API
      const courseData: any = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : 0,
        students: formData.students ? Number(formData.students) : 0,
        category: formData.category || '',
        class: formData.class || '',
        subject: formData.subject || '',
        // Convert array fields to string arrays for the API
        whatYouWillLearn: formData.whatYouWillLearn.map(item => item.value).filter(value => value.trim() !== ''),
        whoIsThisFor: formData.whoIsThisFor.map(item => item.value).filter(value => value.trim() !== ''),
        topics: formData.topics.map(item => item.value).filter(value => value.trim() !== ''),
        // Handle thumbnail - only include if it's a valid image data URL and not too large
        ...(formData.thumbnailUrl && 
            typeof formData.thumbnailUrl === 'string' && 
            formData.thumbnailUrl.trim() !== '' && 
            !formData.thumbnailUrl.startsWith('blob:') && { // Exclude blob URLs (file previews)
          thumbnailUrl: formData.thumbnailUrl // Use 'thumbnailUrl' to match backend entity
        }),
        // Add required fields for backend
        isPublished: false,
        // Ensure all required fields are present
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };

      // Handle file upload
      let formDataToSend: FormData | any;
      
      if (formData.thumbnailFile) {
        // If there's a thumbnail file, use FormData
        formDataToSend = new FormData();
        
        // Add all the form fields
        Object.entries(courseData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              const jsonValue = JSON.stringify(value);
              console.log(`Adding array field ${key}:`, jsonValue);
              formDataToSend.append(key, jsonValue);
            } else {
              console.log(`Adding field ${key}:`, value);
              formDataToSend.append(key, String(value));
            }
          }
        });
        
        // Add the thumbnail file
        formDataToSend.append('thumbnailImage', formData.thumbnailFile);
        
        console.log('=== FORM SUBMISSION DEBUG (WITH FILE) ===');
        console.log('FormData contents:');
        for (let [key, value] of formDataToSend.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        // No file, send as JSON
        formDataToSend = courseData;
        console.log('=== FORM SUBMISSION DEBUG (JSON) ===');
        console.log('Final course data being sent:', courseData);
        console.log('Thumbnail included:', !!courseData.thumbnailUrl);
        console.log('Data keys being sent:', Object.keys(courseData));
      }
      
      console.log('Is editing:', isEditing);
      console.log('Course ID:', courseId);
      
      if (isEditing && courseId) {
        await courseService.updateCourse(courseId, formDataToSend);
        toast.success('Course updated successfully!');
      } else {
        await courseService.createCourse(formDataToSend);
        toast.success('Course created successfully!');
      }
      
      onSuccess?.();
      navigate('/admin/courses');
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle authentication errors
      if (error instanceof Error && error.message === 'Authentication required') {
        navigate('/login');
        return;
      }
      
      toast.error(error instanceof Error ? error.message : 'Failed to save course');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle publishing course
  const handlePublishCourse = async () => {
    if (!courseId) return;
    
    try {
      // Check authentication before publishing
      if (!isAuthenticated) {
        toast.error('Please log in to perform this action');
        navigate('/login');
        return;
      }

      if (!userIsAdmin) {
        toast.error('Admin access required to perform this action');
        navigate('/');
        return;
      }
      
      setIsLoading(true);
      await courseService.publishCourse(courseId, true);
      toast.success('Course published successfully! It will now appear on the main website.');
      onSuccess?.();
    } catch (error) {
      console.error('Error publishing course:', error);
      
      // Handle authentication errors
      if (error instanceof Error && error.message === 'Authentication required') {
        navigate('/login');
        return;
      }
      
      toast.error('Failed to publish course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
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
  }, [isAuthenticated, userIsAdmin, navigate]);

  // Fetch course data if in edit mode
  useEffect(() => {
    const fetchCourse = async () => {
      if (!isEditing || !courseId) return;
      
      try {
        setIsLoading(true);
        // Use the admin version of getCourseById for admin panel
        const courseData = await courseService.getCourseByIdAdmin(courseId);

        // Ensure the level is one of the allowed values
        const validLevels = ['Foundation', 'Intermediate', 'Advanced', 'Expert'] as const;
        const level = validLevels.includes(courseData.level as any)
          ? courseData.level as typeof validLevels[number]
          : 'Foundation';

        // Transform the data for the form
        const formData = {
          title: courseData.title || '',
          slug: courseData.slug || '',
          description: courseData.description || '',
          category: courseData.category || '',
          class: courseData.class || '',
          subject: courseData.subject || '',
          level,
          price: courseData.price || 0,
          originalPrice: courseData.originalPrice,
          duration: courseData.duration || '',
          status: courseData.status || 'draft',
          isFeatured: courseData.isFeatured || false,
          thumbnailUrl: courseData.thumbnailUrl || undefined, // Keep existing thumbnail URL for display
          content: courseData.content || '',
          requirements: courseData.requirements || '',
          whatYouWillLearn: toFieldArray(courseData.whatYouWillLearn as any),
          whoIsThisFor: toFieldArray(courseData.whoIsThisFor as any),
          topics: toFieldArray(courseData.topics as any),
          students: typeof courseData.students === 'number' ? courseData.students : 0,
        };

        form.reset(formData);
        // Set current thumbnail if it exists
        if (courseData.thumbnailUrl) {
          setCurrentThumbnail(courseData.thumbnailUrl);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        
        // Handle authentication errors
        if (error instanceof Error && error.message === 'Authentication required') {
          navigate('/login');
          return;
        }
        
        toast.error('Failed to load course data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [isEditing, courseId, form, navigate]);

  // Reset thumbnail state when editing mode changes
  useEffect(() => {
    if (!isEditing) {
      setCurrentThumbnail(undefined);
    }
  }, [isEditing]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" type="button" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to courses
        </Button>
        <div className="flex gap-2">
          {isEditing && courseId && (
            <Button 
              type="button" 
              variant="outline"
              disabled={isLoading}
              onClick={handlePublishCourse}
            >
              {isLoading ? 'Publishing...' : 'Publish Course'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log('=== Debug Info ===');
              console.log('isAuthenticated:', isAuthenticated);
              console.log('userIsAdmin:', userIsAdmin);
              console.log('user:', user);
              console.log('Token:', localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
              toast.info('Debug info logged to console');
            }}
          >
            Debug Auth
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              authService.clearSession();
              toast.success('Tokens cleared. Please log in again.');
              navigate('/login');
            }}
          >
            Clear Tokens
          </Button>
        </div>

      </div>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Course title"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="course-slug"
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-red-500">
                {form.formState.errors.slug.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('category')}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Class */}
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <select
              id="class"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('class')}
            >
              <option value="">Select a class</option>
              {classOptions.map((classOption) => (
                <option key={classOption.id} value={classOption.id}>
                  {classOption.name}
                </option>
              ))}
            </select>
            {form.formState.errors.class && (
              <p className="text-sm text-red-500">
                {form.formState.errors.class.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <select
              id="subject"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('subject')}
            >
              <option value="">Select a subject</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label>Level</Label>
            <div className="flex gap-4">
              {(['Foundation', 'Intermediate', 'Advanced', 'Expert'] as const).map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`level-${level}`}
                    value={level}
                    {...form.register('level')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`level-${level}`} className="text-sm font-normal">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.level && (
              <p className="text-sm text-red-500">
                {form.formState.errors.level.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('price')}
            />
            {form.formState.errors.price && (
              <p className="text-sm text-red-500">
                {form.formState.errors.price.message}
              </p>
            )}
          </div>

          {/* Original Price */}
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Original Price (₹) - Optional</Label>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('originalPrice')}
            />
            {form.formState.errors.originalPrice && (
              <p className="text-sm text-red-500">
                {form.formState.errors.originalPrice.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 8 weeks, 40 hours"
              {...form.register('duration')}
            />
            {form.formState.errors.duration && (
              <p className="text-sm text-red-500">
                {form.formState.errors.duration.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-4">
              {(['draft', 'active', 'archived'] as const).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`status-${status}`}
                    value={status}
                    {...form.register('status')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm font-normal capitalize">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>

          {/* Featured Course */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                {...form.register('isFeatured')}
                className="h-4 w-4"
              />
              <Label htmlFor="isFeatured">Featured Course</Label>
            </div>
            {form.formState.errors.isFeatured && (
              <p className="text-sm text-red-500">
                {form.formState.errors.isFeatured.message}
              </p>
            )}
          </div>

          {/* Students */}
          <div className="space-y-2">
            <Label htmlFor="students">Maximum Students</Label>
            <Input
              id="students"
              type="number"
              step="1"
              placeholder="0"
              {...form.register('students')}
            />
            {form.formState.errors.students && (
              <p className="text-sm text-red-500">
                {form.formState.errors.students.message}
              </p>
            )}
          </div>

          {/* Course Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Course Content</Label>
            <textarea
              id="content"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the course content, modules, and what students will learn..."
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* Prerequisites & Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Prerequisites & Requirements</Label>
            <textarea
              id="requirements"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="List any prerequisites, required knowledge, or equipment needed..."
              {...form.register('requirements')}
            />
            {form.formState.errors.requirements && (
              <p className="text-sm text-red-500">
                {form.formState.errors.requirements.message}
              </p>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Course Thumbnail</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="max-w-[300px]"
              />
              {/* Show preview if image is uploaded */}
              {currentThumbnail && (
                <div className="mt-2 space-y-2">
                  <img 
                    src={currentThumbnail} 
                    alt="Thumbnail preview" 
                    className="w-32 h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveThumbnail}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Thumbnail
                  </Button>
                </div>
              )}
              {form.formState.errors.thumbnailUrl && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.thumbnailUrl.message}
                </p>
              )}
            </div>
          </div>

          {/* Course Topics */}
          <div className="space-y-2">
            <Label htmlFor="topics">Course Topics</Label>
            <div className="space-y-2">
              {topicsFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Input
                    id={`topics.${index}.value`}
                    {...form.register(`topics.${index}.value`)}
                    placeholder="Add a course topic"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTopicItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addTopicItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>
            {form.formState.errors.topics && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.topics.message}
              </p>
            )}
          </div>



          <div className="space-y-4">
            <div>
              <Label htmlFor="whatYouWillLearn">What You'll Learn</Label>
              <div className="space-y-2">
                {whatYouWillLearnFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Input
                      id={`whatYouWillLearn.${index}.value`}
                      {...form.register(`whatYouWillLearn.${index}.value`)}
                      placeholder="Add a learning point"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeWhatYouWillLearnItem(index)}
                      disabled={whatYouWillLearnFields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addWhatYouWillLearnItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Learning Point
                </Button>
              </div>
              {form.formState.errors.whatYouWillLearn && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.whatYouWillLearn.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="whoIsThisFor">Who This Course Is For</Label>
              <div className="space-y-2">
                {whoIsThisForFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Input
                      id={`whoIsThisFor.${index}.value`}
                      {...form.register(`whoIsThisFor.${index}.value`)}
                      placeholder="Add a target audience"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeWhoIsThisForItem(index)}
                      disabled={whoIsThisForFields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addWhoIsThisForItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Target Audience
                </Button>
              </div>
              {form.formState.errors.whoIsThisFor && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.whoIsThisFor.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/courses')}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Saving...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Course' : 'Save Course'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};