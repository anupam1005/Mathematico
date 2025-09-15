import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Settings, Save, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleClassModal = ({ isOpen, onClose }: ScheduleClassModalProps) => {
  const [date, setDate] = useState<Date>();
  interface FormData {
    title: string;
    description: string;
    subject: string;
    duration: string;
    maxStudents: string;
    time: string;
    recurring: boolean;
    recordClass: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    requireRegistration: boolean;
  }

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    subject: "",
    duration: "60",
    maxStudents: "30",
    time: "",
    recurring: false,
    recordClass: true,
    allowChat: true,
    allowScreenShare: true,
    requireRegistration: false
  });

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", 
    "Programming", "Literature", "History", "Business", "Other"
  ];

  const durations = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "150", label: "2.5 hours" },
    { value: "180", label: "3 hours" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Class scheduled:", { ...formData, date });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-strong">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-primary">
            Schedule Live Class
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Class Details
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Class Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Mathematics - Calculus"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what will be covered in this class..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum Students</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Video className="h-5 w-5 mr-2" />
                Class Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Record Class</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to access recording later
                    </p>
                  </div>
                  <Switch
                    checked={formData.recordClass}
                    onCheckedChange={(checked: boolean) =>
                      setFormData(prev => ({ ...prev, recordClass: checked }))
                    }/>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to chat during class
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowChat}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, allowChat: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Screen Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow screen sharing for students
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowScreenShare}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, allowScreenShare: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Students must register to join
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireRegistration}
                    onCheckedChange={(checked: boolean) =>
                      setFormData(prev => ({ ...prev, requireRegistration: checked }))
                    }/>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recurring Class</Label>
                    <p className="text-sm text-muted-foreground">
                      Repeat this class weekly
                    </p>
                  </div>
                  <Switch
                    checked={formData.recurring}
                    onCheckedChange={(checked: boolean) =>
                      setFormData(prev => ({ ...prev, recurring: checked }))
                    }/>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" variant="gradient" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Schedule Class
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};