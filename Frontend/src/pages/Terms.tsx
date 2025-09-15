import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Scale, 
  Users, 
  AlertTriangle, 
  Shield, 
  Ban, 
  Calendar, 
  Globe,
  Mail,
  UserCheck
} from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Terms of Service
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Effective Date: 07.09.2025
              </Badge>
            </div>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              These Terms govern your use of Mathematico
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
                These Terms of Service ("Terms") govern your use of <strong>Mathematico</strong>. By accessing or using our app, you agree to these Terms.
              </p>
            </CardContent>
          </Card>

          {/* 1. Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserCheck className="h-6 w-6 text-blue-600" />
                1. Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 13 years old (or legal age in your country) to use our app.
              </p>
            </CardContent>
          </Card>

          {/* 2. User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6 text-green-600" />
                2. User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>You are responsible for maintaining the confidentiality of your account and password.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>You agree not to share your account or use another person's account.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <span>We reserve the right to suspend or terminate accounts that violate these Terms.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="h-6 w-6 text-purple-600" />
                3. Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <p className="text-red-800">Use the app for illegal or harmful purposes.</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <p className="text-orange-800">Attempt to hack, disrupt, or misuse our systems.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-yellow-800">Upload malicious content or spam.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Scale className="h-6 w-6 text-indigo-600" />
                4. Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                All content, trademarks, and software are owned by <strong>Mathematico</strong> or our licensors. You may not copy, modify, or distribute without permission.
              </p>
            </CardContent>
          </Card>

          {/* 5. Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                5. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We provide the app "as is" and are not responsible for interruptions, errors, or data loss.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, we are not liable for damages resulting from use of our app.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Ban className="h-6 w-6 text-red-600" />
                6. Termination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your access if you violate these Terms.
              </p>
            </CardContent>
          </Card>

          {/* 7. Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6 text-teal-600" />
                7. Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                We may update these Terms at any time. Continued use of the app means you accept the updated Terms.
              </p>
            </CardContent>
          </Card>

          {/* 8. Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Globe className="h-6 w-6 text-blue-600" />
                8. Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by the laws of <strong>India</strong>.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Mail className="h-6 w-6 text-primary" />
                Questions About These Terms?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                If you have any questions about these Terms of Service, please contact us at:
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

export default Terms;
