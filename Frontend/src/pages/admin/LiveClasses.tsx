import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Play, Square, Calendar, Users, Clock, Video } from 'lucide-react';
import { LiveClass } from '@/types';
import { liveClassService } from '@/services/liveClass.service';
import { useAuth } from '@/contexts/AuthContext';

const LiveClasses: React.FC = () => {
  const navigate = useNavigate();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedLiveClasses, setSelectedLiveClasses] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [liveClassToDelete, setLiveClassToDelete] = useState<string | null>(null);
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

  useEffect(() => {
    if (isAuthenticated && (user?.isAdmin === true || user?.role === 'admin')) {
      fetchLiveClasses();
    }
  }, [isAuthenticated, user]);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const response = await liveClassService.getAllLiveClassesAdmin(1, 100);
      setLiveClasses(response.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch live classes');
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLiveClasses(liveClasses.map(lc => lc.id));
    } else {
      setSelectedLiveClasses([]);
    }
  };

  const handleToggleSelect = (liveClassId: string, checked: boolean) => {
    if (checked) {
      setSelectedLiveClasses(prev => [...prev, liveClassId]);
    } else {
      setSelectedLiveClasses(prev => prev.filter(id => id !== liveClassId));
    }
  };

  const handleDelete = async (liveClassId: string) => {
    try {
      await liveClassService.deleteLiveClass(liveClassId);
      toast.success('Live class deleted successfully');
      fetchLiveClasses();
      setSelectedLiveClasses(prev => prev.filter(id => id !== liveClassId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete live class');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLiveClasses.length === 0) return;

    try {
      await Promise.all(selectedLiveClasses.map(id => liveClassService.deleteLiveClass(id)));
      toast.success(`${selectedLiveClasses.length} live classes deleted successfully`);
      fetchLiveClasses();
      setSelectedLiveClasses([]);
    } catch (error: any) {
      toast.error('Failed to delete some live classes');
    }
  };

  const handleTogglePublishStatus = async (liveClassId: string, currentStatus: boolean) => {
    try {
      await liveClassService.togglePublishStatus(liveClassId, !currentStatus);
      toast.success(`Live class ${currentStatus ? 'unpublished' : 'published'} successfully`);
      fetchLiveClasses();
    } catch (error: any) {
      toast.error('Failed to update publish status');
    }
  };

  const handleStartLiveClass = async (liveClassId: string) => {
    try {
      await liveClassService.startLiveClass(liveClassId);
      toast.success('Live class started successfully');
      fetchLiveClasses();
    } catch (error: any) {
      toast.error('Failed to start live class');
    }
  };

  const handleEndLiveClass = async (liveClassId: string) => {
    try {
      await liveClassService.endLiveClass(liveClassId);
      toast.success('Live class ended successfully');
      fetchLiveClasses();
    } catch (error: any) {
      toast.error('Failed to end live class');
    }
  };

  const openDeleteDialog = (liveClassId: string) => {
    setLiveClassToDelete(liveClassId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (liveClassToDelete) {
      handleDelete(liveClassToDelete);
      setDeleteDialogOpen(false);
      setLiveClassToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      scheduled: { label: 'Scheduled', variant: 'default' as const },
      live: { label: 'Live Now', variant: 'destructive' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredLiveClasses = liveClasses.filter(liveClass => {
    const matchesSearch = liveClass.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liveClass.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liveClass.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || liveClass.status === statusFilter;
    const matchesCategory = !categoryFilter || liveClass.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live classes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-600 mt-2">
            Manage live classes and virtual sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔐 Live Classes Debug Info:');
              console.log('isAuthenticated:', isAuthenticated);
              console.log('user:', user);
              console.log('user.isAdmin:', user?.isAdmin);
              console.log('user.role:', user?.role);
              console.log('Token:', localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
              console.log('User data:', localStorage.getItem('user') || sessionStorage.getItem('user'));
              toast.info('Debug info logged to console');
            }}
          >
            Debug Auth
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                console.log('🧪 Testing Live Classes API...');
                const response = await liveClassService.getAllLiveClassesAdmin(1, 10);
                console.log('✅ API Test Success:', response);
                toast.success('API test successful! Check console for details.');
              } catch (error) {
                console.error('❌ API Test Failed:', error);
                toast.error('API test failed! Check console for details.');
              }
            }}
          >
            Test API
          </Button>
          <Button
            onClick={() => navigate('/admin/live-classes/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Live Class
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Quick Actions</h3>
            <p className="text-xs text-blue-700 mt-1">
              View your live classes on the main website or manage them here
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/live-classes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              <Video className="mr-1.5 h-3 w-3" />
              View on Website
            </Link>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <Calendar className="mr-1.5 h-3 w-3" />
              Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search live classes..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                {selectedLiveClasses.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex-1"
                  >
                    Delete Selected ({selectedLiveClasses.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Classes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Classes ({filteredLiveClasses.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedLiveClasses.length === liveClasses.length && liveClasses.length > 0}
                onCheckedChange={handleToggleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLiveClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      {liveClasses.length === 0 ? 'No live classes found' : 'No live classes match your filters'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLiveClasses.map((liveClass) => (
                  <TableRow key={liveClass.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLiveClasses.includes(liveClass.id)}
                        onCheckedChange={(checked) => handleToggleSelect(liveClass.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{liveClass.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {liveClass.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{liveClass.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(liveClass.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {liveClass.scheduledAt ? new Date(liveClass.scheduledAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {liveClass.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {liveClass.enrolledStudents}/{liveClass.maxStudents}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/live-classes/${liveClass.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/live-classes/${liveClass.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Watch Classes
                          </DropdownMenuItem>
                          {liveClass.status === 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleStartLiveClass(liveClass.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Start Class
                            </DropdownMenuItem>
                          )}
                          {liveClass.status === 'live' && (
                            <DropdownMenuItem onClick={() => handleEndLiveClass(liveClass.id)}>
                              <Square className="w-4 h-4 mr-2" />
                              End Class
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleTogglePublishStatus(liveClass.id, liveClass.isPublished)}>
                            {liveClass.isPublished ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(liveClass.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Live Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this live class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveClasses;
