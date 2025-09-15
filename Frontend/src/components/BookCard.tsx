import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Star, Lock } from "lucide-react";

interface BookCardProps {
  title: string;
  author: string;
  category: string;
  rating: number;
  readTime: string;
  price: string;
  isSubscribed?: boolean;
  coverImage?: string;
}

export const BookCard = ({ 
  title, 
  author, 
  category, 
  rating, 
  readTime, 
  price, 
  isSubscribed = false,
  coverImage 
}: BookCardProps) => {
  return (
    <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-card border border-border">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary-foreground opacity-80" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="shadow-soft">
              {category}
            </Badge>
          </div>
          {!isSubscribed && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-background/90 shadow-soft">
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2 group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">by {author}</p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span>{rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{readTime}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex items-center justify-between">
          <span className="font-semibold text-accent text-lg">{price}</span>
          <Button 
            variant={isSubscribed ? "default" : "gradient"}
            size="sm"
            className="ml-4"
          >
            {isSubscribed ? "Read Now" : "Subscribe"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};