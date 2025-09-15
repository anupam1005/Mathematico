import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Calendar, Clock, PlayCircle } from "lucide-react";

interface LiveClassCardProps {
  title: string;
  teacher: string;
  subject: string;
  startTime: string;
  duration: string;
  students: number;
  status: "upcoming" | "live" | "completed";
  thumbnail?: string;
}

export const LiveClassCard = ({ 
  title, 
  teacher, 
  subject, 
  startTime, 
  duration, 
  students, 
  status,
  thumbnail 
}: LiveClassCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "live": return "bg-red-500 text-white";
      case "upcoming": return "bg-warning text-warning-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "live": return "LIVE NOW";
      case "upcoming": return "UPCOMING";
      case "completed": return "COMPLETED";
      default: return "SCHEDULED";
    }
  };

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-card border border-border">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-primary flex items-center justify-center">
              <Video className="h-12 w-12 text-primary-foreground opacity-80" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={getStatusColor()}>
              {status === "live" && <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />}
              {getStatusText()}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 shadow-soft">
              {subject}
            </Badge>
          </div>
          {status === "live" && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <PlayCircle className="h-16 w-16 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2 group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">by {teacher}</p>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{startTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{students} students</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant={status === "live" ? "destructive" : status === "upcoming" ? "gradient" : "outline"}
          className="w-full"
          disabled={status === "completed"}
        >
          {status === "live" ? "Join Now" : status === "upcoming" ? "Set Reminder" : "View Recording"}
        </Button>
      </CardContent>
    </Card>
  );
};