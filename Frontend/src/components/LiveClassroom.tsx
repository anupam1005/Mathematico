import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MessageCircle, 
  Users, 
  Settings,
  PhoneOff,
  Hand,
  Send,
  MoreVertical
} from "lucide-react";
import { useState } from "react";

interface Participant {
  id: string;
  name: string;
  isTeacher: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isHandRaised: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isTeacher: boolean;
}

export const LiveClassroom = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Sample data
  const participants: Participant[] = [
    { id: "1", name: "Dr. Sarah Johnson (Teacher)", isTeacher: true, isMuted: false, hasVideo: true, isHandRaised: false },
    { id: "2", name: "John Smith", isTeacher: false, isMuted: true, hasVideo: true, isHandRaised: false },
    { id: "3", name: "Emma Wilson", isTeacher: false, isMuted: true, hasVideo: false, isHandRaised: true },
    { id: "4", name: "Mike Brown", isTeacher: false, isMuted: true, hasVideo: true, isHandRaised: false },
  ];

  const chatMessages: ChatMessage[] = [
    { id: "1", sender: "Dr. Sarah Johnson", message: "Welcome everyone! Let's start with today's lesson on Advanced Mathematics.", timestamp: "10:00 AM", isTeacher: true },
    { id: "2", sender: "John Smith", message: "Thank you professor!", timestamp: "10:01 AM", isTeacher: false },
    { id: "3", sender: "Emma Wilson", message: "Can you please share the slides?", timestamp: "10:02 AM", isTeacher: false },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle sending message
      setChatMessage("");
    }
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Advanced Mathematics - Live Class</h1>
            <p className="text-sm text-muted-foreground">Dr. Sarah Johnson • 24 students</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              LIVE
            </Badge>
            <span className="text-sm text-muted-foreground">45:23</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
            {/* Main Teacher Video */}
            <div className="lg:col-span-2 xl:col-span-2 lg:row-span-2">
              <Card className="h-full bg-gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <h3 className="text-lg font-semibold">Dr. Sarah Johnson</h3>
                    <Badge variant="secondary" className="mt-2">Teacher</Badge>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  <Badge variant="outline" className="bg-background/80">
                    <Mic className="h-3 w-3 mr-1" />
                    Speaking
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Student Videos */}
            {participants.slice(1).map((participant) => (
              <Card key={participant.id} className="aspect-video bg-muted relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {participant.hasVideo ? (
                      <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    ) : (
                      <VideoOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <p className="text-xs font-medium text-muted-foreground truncate px-2">
                      {participant.name}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 flex space-x-1">
                  {participant.isMuted ? (
                    <MicOff className="h-3 w-3 text-red-500" />
                  ) : (
                    <Mic className="h-3 w-3 text-success" />
                  )}
                  {participant.isHandRaised && (
                    <Hand className="h-3 w-3 text-warning" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-card border-t border-border p-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full w-12 h-12 p-0"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={hasVideo ? "outline" : "destructive"}
              size="lg"
              onClick={() => setHasVideo(!hasVideo)}
              className="rounded-full w-12 h-12 p-0"
            >
              {hasVideo ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "gradient" : "outline"}
              size="lg"
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className="rounded-full w-12 h-12 p-0"
            >
              <Monitor className="h-5 w-5" />
            </Button>
            
            <Button
              variant={isHandRaised ? "gradient" : "outline"}
              size="lg"
              onClick={() => setIsHandRaised(!isHandRaised)}
              className="rounded-full w-12 h-12 p-0"
            >
              <Hand className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Chat & Participants */}
      {showChat && (
        <div className="w-80 bg-card border-l border-border flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Class Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${msg.isTeacher ? 'text-accent' : 'text-muted-foreground'}`}>
                      {msg.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-2">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Participants */}
          <div className="border-t border-border">
            <div className="p-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Participants ({participants.length})
              </h4>
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between text-sm">
                      <span className={`truncate ${participant.isTeacher ? 'text-accent font-medium' : 'text-foreground'}`}>
                        {participant.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        {participant.isHandRaised && <Hand className="h-3 w-3 text-warning" />}
                        {participant.isMuted ? (
                          <MicOff className="h-3 w-3 text-red-500" />
                        ) : (
                          <Mic className="h-3 w-3 text-success" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      {!showChat && (
        <Button
          variant="gradient"
          className="fixed right-4 top-1/2 transform -translate-y-1/2 rounded-full w-12 h-12 p-0 shadow-strong"
          onClick={() => setShowChat(true)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};