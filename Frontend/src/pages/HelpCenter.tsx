import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  UserPlus, 
  LogIn, 
  Key, 
  LayoutDashboard, 
  Settings, 
  Search, 
  MessageCircle,
  Smartphone,
  Shield,
  Wifi,
  Trash2,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  MessageSquare,
  Lightbulb,
  ChevronRight
} from "lucide-react";

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Help Center
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Your one-stop destination for guidance, FAQs, and support
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-lg text-gray-700 leading-relaxed text-center">
                Welcome to the <strong>Mathematico Help Center</strong> – your one-stop destination for guidance, FAQs, and support. We're here to make your experience smooth and hassle-free.
              </p>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserPlus className="h-6 w-6 text-blue-600" />
                🔹 Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    How to Create an Account
                  </h4>
                  <p className="text-blue-800">Download the app, click "Sign Up," and enter your details.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    How to Log In
                  </h4>
                  <p className="text-green-800">Use your registered email/phone and password.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Forgot Password
                  </h4>
                  <p className="text-purple-800">Click "Forgot Password" on the login page to reset it.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Using the App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <LayoutDashboard className="h-6 w-6 text-green-600" />
                🔹 Using the App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard Overview
                  </h4>
                  <p className="text-blue-800">Learn how to navigate through menus, features, and tools.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Settings
                  </h4>
                  <p className="text-green-800">Update your personal details, change your password, and manage notifications.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Browse
                  </h4>
                  <p className="text-purple-800">Easily find the content or services you're looking for.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <HelpCircle className="h-6 w-6 text-purple-600" />
                🔹 Frequently Asked Questions (FAQs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    Q: How do I update my app?
                  </h4>
                  <p className="text-gray-700 ml-7">A: Visit the App Store/Google Play, go to updates, and install the latest version.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Q: Is my data safe?
                  </h4>
                  <p className="text-gray-700 ml-7">A: Yes, we use industry-standard encryption and privacy policies to protect your data.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-orange-600" />
                    Q: Can I use the app offline?
                  </h4>
                  <p className="text-gray-700 ml-7">A: Some features may be available offline, but most require an internet connection.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Q: How do I delete my account?
                  </h4>
                  <p className="text-gray-700 ml-7">A: Go to Settings &gt; Account &gt; Delete Account or contact our support team.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                🔹 Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    App Not Loading
                  </h4>
                  <p className="text-orange-800">Try restarting the app or checking your internet connection.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Login Issues
                  </h4>
                  <p className="text-red-800">Ensure your credentials are correct. If forgotten, reset your password.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Slow Performance
                  </h4>
                  <p className="text-yellow-800">Clear cache or reinstall the app for better performance.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <MessageCircle className="h-6 w-6 text-primary" />
                🔹 Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                If you need further assistance, our support team is always here for you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a 
                      href="mailto:dipanjanchatterjee23@gmail.com"
                      className="text-primary hover:underline"
                    >
                      dipanjanchatterjee23@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <Phone className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <a 
                      href="tel:+919051089683"
                      className="text-green-600 hover:underline"
                    >
                      +91 9051089683
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Live Chat</p>
                    <a 
                      href="https://whatsapp.com/channel/0029Vb6l1FfDZ4LS79UMoD0V"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      Contact Us on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback & Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                🔹 Feedback & Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed">
                We value your feedback! Share your ideas to help us improve <strong>Mathematico</strong>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpCenter;
