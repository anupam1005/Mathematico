import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cookie, 
  Settings, 
  Eye, 
  Shield, 
  Calendar, 
  Mail, 
  FileText, 
  BarChart3,
  User,
  Target,
  Sliders
} from "lucide-react";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cookie Policy
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Effective Date: 07.09.2025
              </Badge>
            </div>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              How Mathematico uses cookies and similar technologies
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                This Cookie Policy explains how <strong>Mathematico</strong> uses cookies and similar technologies to improve your experience.
              </p>
            </CardContent>
          </Card>

          {/* 1. What Are Cookies? */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Cookie className="h-6 w-6 text-blue-600" />
                1. What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files placed on your device when you use our app. They help us remember your preferences and improve performance.
              </p>
            </CardContent>
          </Card>

          {/* 2. Types of Cookies We Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="h-6 w-6 text-green-600" />
                2. Types of Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Essential Cookies
                  </h4>
                  <p className="text-blue-800">Required for basic functionality (e.g., login, navigation).</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Cookies
                  </h4>
                  <p className="text-green-800">Help us analyze how users interact with the app.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Functional Cookies
                  </h4>
                  <p className="text-purple-800">Remember user preferences (e.g., language, theme).</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Advertising Cookies
                  </h4>
                  <p className="text-orange-800">Deliver relevant ads and track campaign performance.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Eye className="h-6 w-6 text-purple-600" />
                3. How We Use Cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>To keep you signed in.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>To analyze app usage and improve features.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>To personalize recommendations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>To measure effectiveness of promotions.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Sliders className="h-6 w-6 text-indigo-600" />
                4. Managing Cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                You can control cookies through your browser or device settings. Disabling cookies may affect app functionality.
              </p>
            </CardContent>
          </Card>

          {/* 5. Updates to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6 text-teal-600" />
                5. Updates to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy. Any changes will be posted here with a new "Effective Date."
              </p>
            </CardContent>
          </Card>

          {/* 6. Contact Us */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Mail className="h-6 w-6 text-primary" />
                6. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                For questions about our Cookie Policy, contact us at:
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
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cookies;
