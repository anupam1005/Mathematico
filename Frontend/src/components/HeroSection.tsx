import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Trophy } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Educational platform" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Master Mathematics
              <span className="block text-accent">from Class 9 to JEE</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Complete mathematics learning platform with expert courses, live classes, and comprehensive study materials for academic success.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
            <Button variant="hero" size="lg" className="text-lg px-8">
              Explore Courses
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 border-2 border-accent/50 text-primary-foreground bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground hover:border-accent backdrop-blur-sm"
            >
              Browse Books
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-accent">50+</div>
              <div className="text-primary-foreground/80">Math Courses</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-accent">50k+</div>
              <div className="text-primary-foreground/80">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-accent">98%</div>
              <div className="text-primary-foreground/80">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};