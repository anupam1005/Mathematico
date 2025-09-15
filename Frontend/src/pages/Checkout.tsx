import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ArrowLeft,
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  User,
  Clock,
  Users
} from "lucide-react";
import { courseService } from "@/services/course.service";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { Course } from "@/types";
import { getImageUrl } from "@/utils/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  paymentMethod: 'razorpay';
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    paymentMethod: 'razorpay',
    agreeToTerms: false,
    agreeToMarketing: false
  });

  // Get course data from location state or fetch from API
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);
        
        // Pre-fill form with user data if available
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate, user]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    if (!course) return;

    setIsProcessing(true);

    try {
      // Here you would integrate with your payment gateway
      // For now, we'll simulate a successful payment
      
      // Only Razorpay is supported
      await handleRazorpayPayment();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!course) return;

    try {
      // Create payment order
      const paymentData = await paymentService.createPaymentOrder(course.id);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: 'rzp_test_REPhtJhKrjuo5z', // Your Razorpay key ID
          amount: paymentData.order.amount,
          currency: paymentData.order.currency,
          name: 'Mathematico',
          description: `Payment for ${course.title}`,
          order_id: paymentData.order.id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            course_id: course.id,
            course_title: course.title,
          },
          theme: {
            color: '#3b82f6',
          },
          handler: async function (response: any) {
            try {
              // Verify payment
              const verificationData = {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                courseId: course.id,
              };

              const verificationResult = await paymentService.verifyPayment(verificationData);
              
              if (verificationResult.success) {
                toast.success('Payment successful! You are now enrolled in the course.');
                navigate(`/courses/${course.id}`);
              } else {
                toast.error('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: function() {
              toast.error('Payment cancelled');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        toast.error('Failed to load payment gateway. Please try again.');
        document.body.removeChild(script);
      };

    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };




  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-8 w-48 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!course) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
              <p className="text-gray-600 mb-6">The course you're trying to enroll in doesn't exist.</p>
              <Button onClick={() => navigate('/courses')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/courses/${course.id}`)}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        RZ
                      </div>
                      <Label className="flex items-center gap-2">
                        Razorpay (Recommended for India)
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                        required
                      />
                      <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a> *
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketing"
                        checked={formData.agreeToMarketing}
                        onCheckedChange={(checked) => handleInputChange('agreeToMarketing', checked as boolean)}
                      />
                      <Label htmlFor="marketing" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I agree to receive marketing communications about new courses and updates
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Secure Payment</p>
                      <p>Your payment information is encrypted and secure. We never store your card details.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Course Info */}
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      {course.thumbnailUrl && getImageUrl(course.thumbnailUrl) && (
                        <img 
                          src={getImageUrl(course.thumbnailUrl)!} 
                          alt={course.title}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            console.error('Failed to load course thumbnail:', course.thumbnailUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{course.students} students</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course Price</span>
                        <span className="font-medium">{formatPrice(course.price)}</span>
                      </div>
                      
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 line-through">Original Price</span>
                          <span className="text-gray-500 line-through">{formatPrice(course.originalPrice)}</span>
                        </div>
                      )}
                      
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(course.originalPrice - course.price)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-primary">{formatPrice(course.price)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What's Included */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What's Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Lifetime access to course content</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Downloadable study materials</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Community support access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>30-day money-back guarantee</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing || !formData.agreeToTerms}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay {formatPrice(course.price)} & Enroll
                    </>
                  )}
                </Button>

                                 {/* Additional Security Info */}
                 <div className="text-center text-xs text-gray-500 space-y-1">
                   <p>🔒 Your payment is secured by SSL encryption</p>
                   <p>✅ 30-day money-back guarantee</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
