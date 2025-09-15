import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { CourseCategories } from "@/components/CourseCategories";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Users, Clock, Award, CheckCircle, Star, Play, BookText, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

// Types for Section component
interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

// Reusable Section Component
const Section = ({ title, subtitle, children, className = "" }: SectionProps) => (
  <section className={`py-16 md:py-24 ${className}`}>
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
      </div>
      {children}
    </div>
  </section>
);

// Types for FeatureCard component
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Courses",
      description: "Structured learning paths from basic to advanced mathematics concepts."
    },
    {
      icon: Clock,
      title: "Live Interactive Classes",
      description: "Real-time classes with expert educators and peer interaction."
    },
    {
      icon: Award,
      title: "Expert Educators",
      description: "Learn from experienced teachers with proven track records."
    },
    {
      icon: CheckCircle,
      title: "Practice & Assessments",
      description: "Regular tests and practice problems to track your progress."
    },
    {
      icon: Star,
      title: "Personalized Learning",
      description: "Adaptive learning paths based on your performance and goals."
    },
    {
      icon: Users,
      title: "Doubt Solving",
      description: "Get your doubts cleared by experts in dedicated sessions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Master Mathematics
              <span className="block text-accent mt-2">From Basics to JEE Advanced</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
              Join thousands of students who have achieved academic excellence through our comprehensive learning platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" size="lg" className="text-lg px-8">
                <Link to="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground">Expert Educators</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Video Lessons</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Practice Problems</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Section 
        title="Why Choose Our Platform" 
        subtitle="We provide the best learning experience for mathematics students"
        className="bg-background"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Section>

      {/* Learning Resources Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Learning Resources</h2>
            <p className="text-lg text-muted-foreground">
              Access a variety of resources to support your learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border border-border shadow-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Play className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Video Lectures</h3>
              <p className="text-muted-foreground mb-4">High-quality video lessons from expert educators</p>
              <Button variant="link" className="text-blue-600" asChild>
                <Link to="/courses">Watch Now</Link>
              </Button>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border shadow-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <BookText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Study Materials</h3>
              <p className="text-muted-foreground mb-4">Downloadable PDFs, notes, and formula sheets</p>
              <Button variant="link" className="text-purple-600" asChild>
                <Link to="/books">Browse Materials</Link>
              </Button>
            </div>
            
            <div className="bg-card p-8 rounded-xl border border-border shadow-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                <Headphones className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Doubt Solving</h3>
              <p className="text-muted-foreground mb-4">Get your questions answered in real-time</p>
              <Button variant="link" className="text-green-600" asChild>
                <Link to="/live-classes">Join Session</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <CourseCategories />
      
      {/* Live Classes Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Live Classes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our interactive live classes with expert educators and real-time doubt solving sessions.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Live Classes Available Now
                </h3>
                <p className="text-gray-600">
                  Experience interactive learning with expert educators and real-time doubt solving.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Course Content</h4>
                  <p className="text-sm text-gray-600">Access comprehensive course materials</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Self-Paced Learning</h4>
                  <p className="text-sm text-gray-600">Learn at your own pace and schedule</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Community Support</h4>
                  <p className="text-sm text-gray-600">Connect with fellow students</p>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-2">
                  What's Available Now
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Complete course modules with video lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Interactive quizzes and assignments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Progress tracking and certificates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>24/7 access to study materials</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/courses">
                    Explore Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Section 
        title="What Our Students Say" 
        subtitle="Success stories from our community"
        className="bg-background"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Rahul Sharma",
              role: "JEE Advanced 2024 - AIR 124",
              content: "The structured courses and doubt-solving sessions helped me crack JEE Advanced with a great rank. The teachers are phenomenal!"
            },
            {
              name: "Priya Patel",
              role: "Class 12 Board - 98% in Math",
              content: "The study materials and practice tests were exactly what I needed to score well in my board exams. Highly recommended!"
            },
            {
              name: "Amit Kumar",
              role: "NTSE Scholar",
              content: "The Olympiad preparation course gave me the edge I needed. The problem-solving techniques are top-notch!"
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <span className="font-bold text-xl">{testimonial.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground">"{testimonial.content}"</p>
              <div className="flex mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already achieving their academic goals with us.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/signup">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
