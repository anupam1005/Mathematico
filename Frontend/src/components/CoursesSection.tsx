import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, BookOpen, Calculator, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const courses = [
  {
    id: 1,
    title: "Mathematics Class 9-10 Foundation",
    instructor: "Dr. Rajesh Kumar",
    duration: "6 months",
    students: 12500,
    rating: 4.8,
    price: 2999,
    originalPrice: 4999,
    level: "Foundation",
    description: "Complete mathematics foundation for Class 9 & 10 with NCERT and additional practice",
    features: [
      "150+ Live Classes",
      "1000+ Practice Questions", 
      "Weekly Tests & Assessments",
      "Personal Doubt Support",
      "Study Material PDF"
    ],
    topics: ["Algebra", "Geometry", "Trigonometry", "Statistics"],
    popular: false
  },
  {
    id: 2,
    title: "Mathematics Class 11-12 Advanced",
    instructor: "Prof. Anita Sharma",
    duration: "12 months",
    students: 18200,
    rating: 4.9,
    price: 4999,
    originalPrice: 7999,
    level: "Advanced",
    description: "Advanced mathematics for Class 11 & 12 covering all boards with deep conceptual understanding",
    features: [
      "300+ Live Classes",
      "2000+ Practice Questions",
      "Board Exam Strategy",
      "Previous Year Solutions",
      "24/7 Doubt Resolution"
    ],
    topics: ["Calculus", "Coordinate Geometry", "Vectors", "Probability"],
    popular: true
  },
  {
    id: 3,
    title: "JEE Mathematics Masterclass",
    instructor: "Dr. Vikram Singh",
    duration: "18 months",
    students: 25800,
    rating: 4.9,
    price: 8999,
    originalPrice: 12999,
    level: "Expert",
    description: "Complete JEE Main & Advanced mathematics preparation with problem-solving techniques",
    features: [
      "500+ Live Classes",
      "5000+ JEE Questions",
      "Mock Tests Series",
      "Rank Predictor",
      "IIT Faculty Support"
    ],
    topics: ["Differential Calculus", "Integral Calculus", "Complex Numbers", "Matrices"],
    popular: false
  }
];

export const CoursesSection = () => {
  const { toast } = useToast();

  const handlePurchase = (course: typeof courses[0]) => {
    toast({
      title: "Course Purchase",
      description: `You selected ${course.title}. Course purchase functionality will be available once authentication is set up.`,
    });
  };

  return (
    <section id="courses" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Mathematics Courses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master mathematics with our comprehensive courses designed for Class 9-12 and JEE preparation. 
            Learn from expert instructors with proven track records.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className={`relative transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${
                course.popular 
                  ? 'border-accent shadow-medium scale-105' 
                  : 'border-border shadow-soft'
              }`}
            >
              {course.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="bg-gradient-accent">
                    <Target className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-warning mr-1" />
                    {course.rating}
                  </div>
                </div>
                
                <CardTitle className="text-xl font-bold text-primary line-clamp-2">
                  {course.title}
                </CardTitle>
                
                <p className="text-sm text-muted-foreground mb-3">
                  by {course.instructor}
                </p>
                
                <p className="text-sm text-foreground line-clamp-2">
                  {course.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.students.toLocaleString()}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {course.topics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {course.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <BookOpen className="h-3 w-3 text-success mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-accent">
                        ₹{course.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{course.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-success">
                      Save ₹{(course.originalPrice - course.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button 
                  onClick={() => handlePurchase(course)}
                  variant={course.popular ? "default" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Enroll Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            All courses include • Live Classes • Recorded Videos • Study Material • Doubt Support
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <span>✓ Expert Faculty</span>
            <span>✓ Money Back Guarantee</span>
            <span>✓ Lifetime Access</span>
          </div>
        </div>
      </div>
    </section>
  );
};