import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationForm from "@/components/auth/RegistrationForm";
import BillingSection from "@/components/billing/BillingSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RegisterBilling = () => {
  const [activeTab, setActiveTab] = useState("register");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="section-container">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-pulse-100 text-pulse-600 border border-pulse-200">
              <span className="text-sm font-medium">Get Started</span>
            </div>
            <h1 className="section-title">
              Join the 
              <span className="bg-hero-gradient bg-clip-text text-transparent"> Future</span>
            </h1>
            <p className="section-subtitle mx-auto">
              Create your account and choose the perfect plan for your needs
            </p>
          </div>

          {/* Tabs */}
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="register" className="text-lg py-3">
                  Create Account
                </TabsTrigger>
                <TabsTrigger value="billing" className="text-lg py-3">
                  Choose Plan
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="register" className="space-y-6">
                <RegistrationForm onSuccess={() => setActiveTab("billing")} />
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-6">
                <BillingSection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegisterBilling;