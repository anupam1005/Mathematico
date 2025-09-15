import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Globe,
  BookText
} from "lucide-react";
import { adminService, DashboardStats } from "@/services/admin.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { BackendStatus } from "@/components/BackendStatus";

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

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
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Add debug function
  const showDebugInfo = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    setDebugInfo({
      isAuthenticated: authService.isAuthenticated(),
      token: token ? `${token.substring(0, 20)}...` : 'No token',
      user: userData ? 'Present' : 'Missing',
      localStorage: {
        token: localStorage.getItem('access_token') ? 'Present' : 'Missing',
        user: localStorage.getItem('user') ? 'Present' : 'Missing'
      },
      sessionStorage: {
        token: sessionStorage.getItem('access_token') ? 'Present' : 'Missing',
        user: sessionStorage.getItem('user') ? 'Present' : 'Missing'
      }
    });
  };

  const clearCorruptedTokens = () => {
    authService.clearSession();
    toast.success('Corrupted tokens cleared. Please log in again.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No dashboard data available</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.stats.totalUsers,
      icon: Users,
      description: "Registered users",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Total Students",
      value: stats.stats.totalStudents,
      icon: GraduationCap,
      description: "Active students",
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Total Courses",
      value: stats.stats.totalCourses,
      icon: BookOpen,
      description: "Available courses",
      trend: "+5%",
      trendUp: true
    },
    {
      title: "Total Revenue",
      value: `₹${stats.stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total earnings",
      trend: "+15%",
      trendUp: true
    },
    {
      title: "Active Batches",
      value: stats.stats.activeBatches,
      icon: Activity,
      description: "Running batches",
      trend: "+3%",
      trendUp: true
    },
    {
      title: "Total Modules",
      value: stats.stats.totalModules,
      icon: Calendar,
      description: "Course modules",
      trend: "+7%",
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your mathematics learning platform
        </p>
      </div>

      {/* Debug Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={showDebugInfo} variant="outline" size="sm">
              Show Debug Info
            </Button>
            <Button onClick={clearCorruptedTokens} variant="outline" size="sm">
              Clear Corrupted Tokens
            </Button>
          </div>
          {debugInfo && (
            <div className="text-sm space-y-2">
              <pre className="bg-white p-2 rounded border overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Changes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5 text-blue-600" />
            View Your Changes on Main Website
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click the links below to see how your changes appear on the main website:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              <Globe className="mr-2 h-4 w-4" />
              Homepage
              <ExternalLink className="ml-auto h-4 w-4" />
            </a>
            <a
              href="/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Course Home
              <ExternalLink className="ml-auto h-4 w-4" />
            </a>
            <a
              href="/live-classes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Live Classes
              <ExternalLink className="ml-auto h-4 w-4" />
            </a>
            <a
              href="/books"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition-colors"
            >
              <BookText className="mr-2 h-4 w-4" />
              Study Materials
              <ExternalLink className="ml-auto h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ml-1 ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Backend Status */}
      <div className="flex justify-center">
        <BackendStatus showInAdmin={true} />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentCourses.map((course) => (
                <div key={course.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.category}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
