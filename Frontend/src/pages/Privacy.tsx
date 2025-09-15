import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Database, Users, Mail, Calendar, AlertTriangle } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Effective Date: 07.09.2025
              </Badge>
            </div>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              How Mathematico collects, uses, and protects your personal information
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
                This Privacy Policy explains how <strong>Mathematico</strong> ("we," "our," or "us") collects, uses, and protects your personal information when you use our application and related services. By using our app, you agree to the practices described in this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* 1. Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="h-6 w-6 text-blue-600" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may collect the following types of information:
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Personal Information</h4>
                  <p className="text-blue-800">Name, email address, phone number, or any details you provide when creating an account.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Usage Data</h4>
                  <p className="text-green-800">How you interact with our app (pages visited, features used, time spent).</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Device Information</h4>
                  <p className="text-purple-800">IP address, browser type, operating system, and device identifiers.</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Cookies & Tracking Data</h4>
                  <p className="text-orange-800">To personalize and improve your experience.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lock className="h-6 w-6 text-green-600" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information collected for:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Providing and improving our services.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Sending important updates, notifications, and promotional offers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Enhancing security and preventing fraud.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Personalizing content and user experience.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. How We Share Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Eye className="h-6 w-6 text-purple-600" />
                3. How We Share Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Service Providers</h4>
                  <p className="text-blue-800">With trusted third parties who help us run our app.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Legal Requirements</h4>
                  <p className="text-green-800">When required to comply with laws, regulations, or government requests.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Business Transfers</h4>
                  <p className="text-purple-800">If we merge, acquire, or sell, your data may be transferred.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Database className="h-6 w-6 text-orange-600" />
                4. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                We use industry-standard measures to protect your information from unauthorized access, misuse, or disclosure. However, no system is 100% secure.
              </p>
            </CardContent>
          </Card>

          {/* 5. Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6 text-indigo-600" />
                5. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Access, update, or delete your personal data.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Withdraw consent for data processing.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>Opt out of marketing communications.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                6. Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Our services are not directed to children under 13 (or the minimum legal age in your country). We do not knowingly collect information from them.
              </p>
            </CardContent>
          </Card>

          {/* 7. Changes to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6 text-teal-600" />
                7. Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy. Any changes will be posted with a revised "Effective Date."
              </p>
            </CardContent>
          </Card>

          {/* 8. Contact Us */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Mail className="h-6 w-6 text-primary" />
                8. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                If you have any questions, please contact us at:
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

export default Privacy;
