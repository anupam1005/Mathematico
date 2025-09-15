import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Globe, 
  Mail, 
  Shield, 
  Save,
  RefreshCw
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AdminSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  max_file_size: number;
  supported_file_types: string;
}

export const SettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    site_name: '',
    site_description: '',
    contact_email: '',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: true,
    max_file_size: 10,
    supported_file_types: 'jpg,jpeg,png,pdf,doc,docx'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
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
      loadSettings();
    }
  }, [isAuthenticated, user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      
      // Map the settings to our interface
      const mappedSettings: AdminSettings = {
        site_name: data.site_name || '',
        site_description: data.site_description || '',
        contact_email: data.contact_email || '',
        maintenance_mode: data.maintenance_mode === 'true',
        allow_registration: data.allow_registration !== 'false',
        require_email_verification: data.require_email_verification !== 'false',
        max_file_size: parseInt(data.max_file_size) || 10,
        supported_file_types: data.supported_file_types || 'jpg,jpeg,png,pdf,doc,docx'
      };
      
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof AdminSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert settings to the format expected by the backend
      const settingsData: Record<string, any> = {
        site_name: settings.site_name,
        site_description: settings.site_description,
        contact_email: settings.contact_email,
        maintenance_mode: settings.maintenance_mode.toString(),
        allow_registration: settings.allow_registration.toString(),
        require_email_verification: settings.require_email_verification.toString(),
        max_file_size: settings.max_file_size.toString(),
        supported_file_types: settings.supported_file_types
      };
      
      await adminService.updateSettings(settingsData);
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="files">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => handleSettingChange('site_name', e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => handleSettingChange('site_description', e.target.value)}
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
                />
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_registration"
                  checked={settings.allow_registration}
                  onCheckedChange={(checked) => handleSettingChange('allow_registration', checked)}
                />
                <Label htmlFor="allow_registration">Allow User Registration</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="require_email_verification"
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => handleSettingChange('require_email_verification', checked)}
                />
                <Label htmlFor="require_email_verification">Require Email Verification</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email_email">Contact Email</Label>
                <Input
                  id="contact_email_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="require_email_verification_email"
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => handleSettingChange('require_email_verification', checked)}
                />
                <Label htmlFor="require_email_verification_email">Require Email Verification</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_file_size">Maximum File Size (MB)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  value={settings.max_file_size}
                  onChange={(e) => handleSettingChange('max_file_size', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supported_file_types">Supported File Types</Label>
                <Input
                  id="supported_file_types"
                  value={settings.supported_file_types}
                  onChange={(e) => handleSettingChange('supported_file_types', e.target.value)}
                  placeholder="jpg,jpeg,png,pdf,doc,docx"
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of file extensions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;