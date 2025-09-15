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
import { ArrowLeft, Save, Video, Calendar, Users, X } from 'lucide-react';
import { LiveClass } from '@/types';
import { liveClassService } from '@/services/liveClass.service';

interface LiveClassFormProps {
  liveClass?: LiveClass;
  isEditing: boolean;
  onSuccess: () => void;
}

const LiveClassForm: React.FC<LiveClassFormProps> = ({ liveClass, isEditing, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [currentLiveClass, setCurrentLiveClass] = useState<LiveClass | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    category: string;
    subject: string;
    class: string;
    level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
    thumbnailUrl: string;
    meetingUrl: string;
    meetingId: string;
    meetingPassword: string;
    scheduledAt: string;
    duration: string;
    maxStudents: string;
    status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
    isPublished: boolean;
    isFeatured: boolean;
    isRecordingEnabled: boolean;
    topics: string;
    prerequisites: string;
    materials: string;
    notes: string;
    courseId: string;
  }>({
    title: '',
    slug: '',
    description: '',
    category: '',
    subject: '',
    class: '',
    level: 'Foundation',
    thumbnailUrl: '',
    meetingUrl: '',
    meetingId: '',
    meetingPassword: '',
    scheduledAt: '',
    duration: '',
    maxStudents: '',
    status: 'draft',
    isPublished: false,
    isFeatured: false,
    isRecordingEnabled: false,
    topics: '',
    prerequisites: '',
    materials: '',
    notes: '',
    courseId: ''
  });


  // Fetch live class data when in edit mode
  useEffect(() => {
    const fetchLiveClassData = async () => {
      if (isEditing && id && !liveClass) {
        setDataLoading(true);
        try {
          console.log('Fetching live class data for ID:', id);
          const liveClassData = await liveClassService.getLiveClassByIdAdmin(id);
          console.log('Fetched live class data:', liveClassData);
          setCurrentLiveClass(liveClassData);
        } catch (error) {
          console.error('Error fetching live class data:', error);
          toast.error('Failed to load live class data');
          navigate('/admin/live-classes');
        } finally {
          setDataLoading(false);
        }
      } else if (liveClass) {
        setCurrentLiveClass(liveClass);
      }
    };

    fetchLiveClassData();
  }, [isEditing, id, liveClass, navigate]);

  useEffect(() => {
    if (currentLiveClass && isEditing) {
      console.log('Initializing form data with live class:', currentLiveClass);
      setFormData({
        title: currentLiveClass.title || '',
        slug: currentLiveClass.slug || '',
        description: currentLiveClass.description || '',
        category: currentLiveClass.category || '',
        subject: currentLiveClass.subject || '',
        class: currentLiveClass.class || '',
        level: currentLiveClass.level || 'Foundation',
        thumbnailUrl: currentLiveClass.thumbnailUrl || '',
        meetingUrl: currentLiveClass.meetingUrl || '',
        meetingId: currentLiveClass.meetingId || '',
        meetingPassword: currentLiveClass.meetingPassword || '',
        scheduledAt: currentLiveClass.scheduledAt ? new Date(currentLiveClass.scheduledAt).toISOString().slice(0, 16) : '',
        duration: currentLiveClass.duration?.toString() || '',
        maxStudents: currentLiveClass.maxStudents?.toString() || '',
        status: currentLiveClass.status || 'draft',
        isPublished: currentLiveClass.isPublished || false,
        isFeatured: currentLiveClass.isFeatured || false,
        isRecordingEnabled: currentLiveClass.isRecordingEnabled || false,
        topics: Array.isArray(currentLiveClass.topics) ? currentLiveClass.topics.join(', ') : (currentLiveClass.topics || ''),
        prerequisites: currentLiveClass.prerequisites || '',
        materials: currentLiveClass.materials || '',
        notes: currentLiveClass.notes || '',
        courseId: currentLiveClass.courseId || ''
      });
      
      // Set thumbnail preview if exists
      if (currentLiveClass.thumbnailUrl) {
        setThumbnailPreview(currentLiveClass.thumbnailUrl);
      }
    }
  }, [currentLiveClass, isEditing]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.scheduledAt) {
      toast.error('Scheduled date and time is required');
      return;
    }
    
    if (!formData.courseId.trim()) {
      toast.error('Related course is required');
      return;
    }
    
    
    setLoading(true);

    try {
      // Prepare data for submission
      const baseData = {
        ...formData,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        duration: parseInt(formData.duration) || 60,
        maxStudents: parseInt(formData.maxStudents) || 50,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
        topics: formData.topics ? formData.topics.split(',').map(topic => topic.trim()).filter(Boolean) : [],
        courseId: formData.courseId || undefined
      };

      // If there's a thumbnail file, use FormData
      if (thumbnailFile) {
        const formDataToSend = new FormData();
        
        // Add all the form fields
        Object.entries(baseData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              formDataToSend.append(key, JSON.stringify(value));
            } else {
              formDataToSend.append(key, String(value));
            }
          }
        });
        
        // Add the thumbnail file
        formDataToSend.append('thumbnailImage', thumbnailFile);
        
        // Debug: Log FormData contents
        console.log('FormData contents:');
        for (let [key, value] of formDataToSend.entries()) {
          console.log(`${key}:`, value);
        }
        
        if (isEditing && id) {
          await liveClassService.updateLiveClass(id, formDataToSend);
          toast.success('Live class updated successfully');
        } else {
          await liveClassService.createLiveClass(formDataToSend);
          toast.success('Live class created successfully');
        }
      } else {
        // No file, send as JSON
        if (isEditing && id) {
          await liveClassService.updateLiveClass(id, baseData);
          toast.success('Live class updated successfully');
        } else {
          await liveClassService.createLiveClass(baseData);
          toast.success('Live class created successfully');
        }
      }

      onSuccess();
      navigate('/admin/live-classes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save live class');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/live-classes');
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/live-classes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Live Classes
          </Button>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Edit Live Class</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading live class data...</p>
          </div>
        </div>
      </div>
    );
  }

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
          Back to Live Classes
        </Button>
        <div className="flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Live Class' : 'Create New Live Class'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Basic Information
              {isEditing && (
                <Badge variant="secondary" className="ml-2">
                  Editing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter live class title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter live class description"
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
                <Label htmlFor="courseId">Related Course *</Label>
                <Input
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => handleInputChange('courseId', e.target.value)}
                  placeholder="Enter course title or ID"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule & Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="60"
                  type="number"
                  min="15"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL</Label>
                <Input
                  id="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={(e) => handleInputChange('meetingUrl', e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingId">Meeting ID</Label>
                <Input
                  id="meetingId"
                  value={formData.meetingId}
                  onChange={(e) => handleInputChange('meetingId', e.target.value)}
                  placeholder="Meeting ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingPassword">Meeting Password</Label>
                <Input
                  id="meetingPassword"
                  value={formData.meetingPassword}
                  onChange={(e) => handleInputChange('meetingPassword', e.target.value)}
                  placeholder="Meeting password"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum Students</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maxStudents"
                    value={formData.maxStudents}
                    onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                    placeholder="50"
                    type="number"
                    min="1"
                  />
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content & Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnailFile">Thumbnail Image</Label>
              <p className="text-sm text-gray-600">Upload an image file (JPG, PNG, GIF). Maximum size: 10MB.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="thumbnailFile"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="cursor-pointer"
                  />
                  {thumbnailFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeThumbnail}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
                {thumbnailPreview && (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
                {formData.thumbnailUrl && !thumbnailFile && (
                  <div className="text-sm text-gray-600">
                    Current thumbnail: {formData.thumbnailUrl}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Topics Covered</Label>
              <Input
                id="topics"
                value={formData.topics}
                onChange={(e) => handleInputChange('topics', e.target.value)}
                placeholder="topic1, topic2, topic3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prerequisites</Label>
              <Textarea
                id="prerequisites"
                value={formData.prerequisites}
                onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                placeholder="What students should know before joining this class"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Required Materials</Label>
              <Textarea
                id="materials"
                value={formData.materials}
                onChange={(e) => handleInputChange('materials', e.target.value)}
                placeholder="Materials students need for this class"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information for students"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    Available to students
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
                    Show in featured
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recording</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecordingEnabled"
                    checked={formData.isRecordingEnabled}
                    onChange={(e) => handleInputChange('isRecordingEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isRecordingEnabled" className="text-sm">
                    Enable recording
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
              console.log('Auth Debug - LiveClassForm:');
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
            {loading ? 'Saving...' : (isEditing ? 'Update Live Class' : 'Create Live Class')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LiveClassForm;
