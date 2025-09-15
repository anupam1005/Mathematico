import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Shield, 
  Zap, 
  Users, 
  Target, 
  Lightbulb, 
  Mail,
  BookOpen,
  Award,
  Globe
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Us
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Welcome to Mathematico, and thank you for being part of our journey!
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Who We Are */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-8 w-8 text-blue-600" />
                Who We Are
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                We are a passionate team of developers, designers, and innovators committed to creating solutions that make everyday life simpler, smarter, and more enjoyable. Our goal is to provide an app that not only works flawlessly but also delivers real value to our users.
              </p>
            </CardContent>
          </Card>

          {/* Our Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Target className="h-8 w-8 text-green-600" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our mission is to make learning accessible for everyone. We believe technology should be easy to use, reliable, and beneficial for everyone.
              </p>
            </CardContent>
          </Card>

          {/* What We Do */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Lightbulb className="h-8 w-8 text-yellow-600" />
                What We Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">User-Centered Design</h3>
                  <p className="text-gray-600">We design with our users in mind, ensuring smooth navigation and a great experience.</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Constant Innovation</h3>
                  <p className="text-gray-600">We are always improving and adding new features based on user feedback.</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Secure & Reliable</h3>
                  <p className="text-gray-600">We value your trust and work hard to keep your data secure and private.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Award className="h-8 w-8 text-orange-600" />
                Why Choose Us?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">A simple and intuitive interface.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Fast and secure services.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">A dedicated support team always ready to help.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Regular updates to meet user needs.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Globe className="h-8 w-8 text-indigo-600" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                We envision a world where technology bridges gaps, solves everyday problems, and empowers people to achieve more. With Mathematico, we aim to be part of that change.
              </p>
            </CardContent>
          </Card>

          {/* Get in Touch */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Mail className="h-8 w-8 text-primary" />
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We love hearing from our users! If you have suggestions, feedback, or questions, please contact us at:
              </p>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Mail className="h-6 w-6 text-primary" />
                <a 
                  href="mailto:dipanjanchatterjee23@gmail.com"
                  className="text-lg font-medium text-primary hover:underline"
                >
                  dipanjanchatterjee23@gmail.com
                </a>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mt-6">
                Together, let's build a better digital experience with Mathematico.
              </p>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center py-8">
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of students who are already achieving their academic goals with Mathematico.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/courses"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Explore Courses
                </a>
                <a 
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors"
                >
                  Get Started Free
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
