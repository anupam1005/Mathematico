import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "₹499",
    period: "month",
    description: "Perfect for individual learners",
    features: [
      "Access to 100+ books",
      "Basic reading features",
      "Mobile app access",
      "Email support"
    ],
    popular: false
  },
  {
    name: "Premium",
    price: "₹999",
    period: "month", 
    description: "Most popular for serious students",
    features: [
      "Access to 1000+ books",
      "Advanced reading features",
      "Offline downloads",
      "Note-taking & highlights",
      "Priority support",
      "Study guides & summaries"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "₹2,499",
    period: "month",
    description: "For institutions and teams",
    features: [
      "Unlimited book access",
      "Team collaboration tools",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated support",
      "Bulk licensing",
      "Admin dashboard"
    ],
    popular: false
  }
];

export const SubscriptionSection = () => {
  return (
    <section id="subscription" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Choose Your Learning Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible subscription plans to match your learning goals. 
            Start with a free trial and upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:shadow-medium hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-accent shadow-medium scale-105' 
                  : 'border-border shadow-soft'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="bg-gradient-accent">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-primary">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-accent">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-success mr-3 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button 
                  variant={plan.popular ? "gradient" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.popular && <Zap className="h-4 w-4 mr-2" />}
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            All plans include a 7-day free trial • Cancel anytime • No hidden fees
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <span>✓ Secure payments</span>
            <span>✓ 30-day money back</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </div>
    </section>
  );
};