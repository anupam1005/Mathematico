import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Clock, 
  Users, 
  Calendar, 
  Play, 
  ExternalLink, 
  ArrowLeft,
  User,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { liveClassService } from '@/services/liveClass.service';
import { LiveClass } from '@/types';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { getImageUrl } from '@/utils/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LiveClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveClass = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        console.log('🔍 Frontend: Fetching live class with ID:', id);
        const response = await liveClassService.getLiveClassById(id);
        console.log('📊 Frontend: Received response:', response);
        console.log('📋 Frontend: Response type:', typeof response);
        console.log('📋 Frontend: Response keys:', response ? Object.keys(response) : 'null');
        setLiveClass(response);
      } catch (error) {
        console.error('❌ Frontend: Error fetching live class:', error);
        toast.error('Failed to load live class details');
        navigate('/live-classes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveClass();
  }, [id, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinMeeting = () => {
    if (liveClass?.meetingUrl) {
      window.open(liveClass.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const copyMeetingUrl = () => {
    if (liveClass?.meetingUrl) {
      navigator.clipboard.writeText(liveClass.meetingUrl);
      toast.success('Meeting URL copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading live class details...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Class Not Found</h1>
            <p className="text-gray-600 mb-6">The live class you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/live-classes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Live Classes
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/live-classes')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Live Classes
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(liveClass.status)}>
                        {getStatusIcon(liveClass.status)}
                        <span className="ml-1 capitalize">{liveClass.status}</span>
                      </Badge>
                      {liveClass.isFeatured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-bold">{liveClass.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {liveClass.description || 'No description available'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Live Class Thumbnail */}
                {liveClass.thumbnailUrl && getImageUrl(liveClass.thumbnailUrl) && (
                  <div className="mb-6">
                    <img 
                      src={getImageUrl(liveClass.thumbnailUrl)!} 
                      alt={liveClass.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Failed to load live class thumbnail:', liveClass.thumbnailUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Scheduled:</strong> {formatDateTime(liveClass.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Duration:</strong> {liveClass.duration} minutes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Enrolled:</strong> {liveClass.enrolledStudents} / {liveClass.maxStudents}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>Instructor:</strong> {liveClass.instructor?.name || 'Loading...'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting URL - Highlighted Section */}
            {liveClass.meetingUrl && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900 flex items-center">
                    <Video className="w-6 h-6 mr-2" />
                    Join Live Class
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Click the button below to join the live class meeting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Meeting URL:</p>
                        <p className="text-sm text-gray-600 break-all">{liveClass.meetingUrl}</p>
                        {liveClass.meetingId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Meeting ID: {liveClass.meetingId}
                          </p>
                        )}
                        {liveClass.meetingPassword && (
                          <p className="text-xs text-gray-500">
                            Password: {liveClass.meetingPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleJoinMeeting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Join Meeting
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      onClick={copyMeetingUrl}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Copy URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Course Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Related Course:</span>
                    <p className="text-gray-600">{liveClass.courseId}</p>
                  </div>
                  {liveClass.category && (
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-600">{liveClass.category}</p>
                    </div>
                  )}
                  {liveClass.subject && (
                    <div>
                      <span className="font-medium text-gray-700">Subject:</span>
                      <p className="text-gray-600">{liveClass.subject}</p>
                    </div>
                  )}
                  {liveClass.level && (
                    <div>
                      <span className="font-medium text-gray-700">Level:</span>
                      <Badge variant="outline" className="ml-2">
                        {liveClass.level}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topics */}
            {liveClass.topics && liveClass.topics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topics Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {liveClass.topics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {liveClass.prerequisites && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{liveClass.prerequisites}</p>
                </CardContent>
              </Card>
            )}

            {/* Materials */}
            {liveClass.materials && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{liveClass.materials}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {liveClass.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{liveClass.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Class Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Class Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(liveClass.status)}`}>
                    {getStatusIcon(liveClass.status)}
                    <span className="ml-2 capitalize">{liveClass.status}</span>
                  </div>
                </div>
                
                {liveClass.status === 'live' && (
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">
                      Class is currently live!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Join Meeting" to participate
                    </p>
                  </div>
                )}
                
                {liveClass.status === 'scheduled' && (
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">
                      Class is scheduled
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Join when the class starts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recording */}
            {liveClass.recordingUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Class Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    asChild 
                    className="w-full"
                    variant="outline"
                  >
                    <a 
                      href={liveClass.recordingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Recording
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Class Info */}
            <Card>
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{liveClass.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Students:</span>
                  <span className="text-sm font-medium">{liveClass.maxStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Enrolled:</span>
                  <span className="text-sm font-medium">{liveClass.enrolledStudents}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {new Date(liveClass.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LiveClassDetails;
