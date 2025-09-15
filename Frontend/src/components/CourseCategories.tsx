import { BookOpen, Calculator, Clock, Target, School, BrainCircuit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type CategoryCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count: number;
  color: string;
};

const CategoryCard = ({ icon: Icon, title, description, count, color }: CategoryCardProps) => (
  <Card className="h-full hover:shadow-md transition-shadow overflow-hidden group">
    <div className="p-6">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{count}+ Courses</span>
        <Button variant="ghost" size="sm" className="group-hover:text-primary" asChild>
          <Link to="/courses">
            Explore
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </Button>
      </div>
    </div>
  </Card>
);

export const CourseCategories = () => {
  const categories = [
    {
      icon: BookOpen,
      title: "Foundation Courses",
      description: "Build strong fundamentals for Classes 9-10 with our comprehensive curriculum.",
      count: 12,
      color: "bg-blue-500"
    },
    {
      icon: Calculator,
      title: "JEE Main & Advanced",
      description: "Master concepts and problem-solving techniques for engineering entrance exams.",
      count: 8,
      color: "bg-purple-500"
    },
    {
      icon: Clock,
      title: "Crash Courses",
      description: "Fast-track your preparation with our intensive revision programs.",
      count: 5,
      color: "bg-green-500"
    },
    {
      icon: Target,
      title: "Olympiad Preparation",
      description: "Specialized training for national and international mathematics olympiads.",
      count: 4,
      color: "bg-red-500"
    },
    {
      icon: School,
      title: "Board Exam Prep",
      description: "Comprehensive coverage of board exam syllabus with practice papers.",
      count: 10,
      color: "bg-yellow-500"
    },
    {
      icon: BrainCircuit,
      title: "Advanced Problem Solving",
      description: "Enhance your problem-solving skills with advanced concepts and techniques.",
      count: 6,
      color: "bg-pink-500"
    }
  ];

  return (
    <div className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Our Course Categories</h2>
          <p className="text-lg text-muted-foreground">
            Choose from a variety of courses designed to meet your learning needs and goals.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={index} {...category} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link to="/courses" className="flex items-center gap-2">
              View All Courses
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

