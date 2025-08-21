import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  CreditCard,
  Shield,
  Headphones,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    period: "month",
    description: "Perfect for individuals and small teams getting started",
    icon: Rocket,
    color: "text-blue-600 bg-blue-50",
    features: [
      "Up to 5 document uploads per day",
      "Basic AI document analysis",
      "5GB cloud storage",
      "Email support",
      "Mobile app access",
      "Basic templates"
    ],
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    period: "month",
    description: "Advanced features for growing businesses and teams",
    icon: Zap,
    color: "text-pulse-600 bg-pulse-50",
    features: [
      "Unlimited document uploads",
      "Advanced AI analysis & insights",
      "50GB cloud storage",
      "Priority support",
      "Team collaboration tools",
      "Custom templates",
      "API access",
      "Advanced security features"
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    period: "month",
    description: "Complete solution for large organizations",
    icon: Crown,
    color: "text-purple-600 bg-purple-50",
    features: [
      "Everything in Professional",
      "Unlimited storage",
      "Custom AI model training",
      "24/7 dedicated support",
      "Advanced analytics dashboard",
      "Custom integrations",
      "SOC 2 compliance",
      "Single sign-on (SSO)"
    ],
    popular: false,
  },
];

const BillingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [isAnnual, setIsAnnual] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount for annual
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="text-center">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-colors",
              !isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-colors relative",
              isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            )}
          >
            Annual
            <Badge className="absolute -top-1 -right-2 bg-pulse-500 text-white text-xs">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = isAnnual ? getAnnualPrice(plan.price) : plan.price;
          const period = isAnnual ? "year" : plan.period;
          
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all duration-300 hover:shadow-elegant-hover",
                selectedPlan === plan.id
                  ? "ring-2 ring-pulse-500 shadow-elegant-hover"
                  : "hover:shadow-elegant",
                plan.popular && "border-pulse-500"
              )}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-pulse-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className={cn("inline-flex p-3 rounded-2xl", plan.color)}>
                  <Icon className="h-8 w-8" />
                </div>
                
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-gray-600">/{period}</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-green-600">
                      ${plan.price * 12 - price} saved annually
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={cn(
                    "w-full",
                    selectedPlan === plan.id
                      ? "button-primary"
                      : "button-secondary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle plan selection
                  }}
                >
                  {selectedPlan === plan.id ? "Selected Plan" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl shadow-elegant p-8">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-6 w-6 text-pulse-600" />
          <h3 className="text-xl font-semibold">Payment Method</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Country
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pulse-500 focus:border-transparent">
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Australia</option>
                <option>Germany</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold">Secure & Protected</h4>
          </div>
          <p className="text-gray-600 text-sm">
            Your payment information is encrypted and secure. We use industry-standard SSL encryption.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Headphones className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold">24/7 Support</h4>
          </div>
          <p className="text-gray-600 text-sm">
            Need help? Our support team is available around the clock to assist you.
          </p>
        </div>
      </div>

      {/* Complete Purchase */}
      <div className="text-center">
        <Button className="button-primary text-lg px-12 py-4">
          Complete Purchase
        </Button>
        <p className="text-gray-500 text-sm mt-4">
          30-day money-back guarantee • Cancel anytime
        </p>
      </div>
    </div>
  );
};

export default BillingSection;