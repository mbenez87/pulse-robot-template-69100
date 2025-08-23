import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Brain, Shield, Globe, Cpu, Database } from 'lucide-react';

const Platform = () => {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms that understand and process your documents with human-like comprehension.",
      badge: "Core Technology"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast Processing",
      description: "Process thousands of documents in seconds with our optimized infrastructure and parallel computing.",
      badge: "Performance"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption, compliance with GDPR, SOC2, and enterprise-level access controls.",
      badge: "Security"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Scale",
      description: "Multi-region deployment with 99.9% uptime and edge computing for optimal performance worldwide.",
      badge: "Infrastructure"
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "Smart Automation",
      description: "Intelligent workflows that adapt to your usage patterns and automate repetitive tasks.",
      badge: "Automation"
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Unified Data Layer",
      description: "Seamlessly integrate with your existing tools and databases through our robust API ecosystem.",
      badge: "Integration"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <motion.div
        className="container mx-auto px-4 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            Platform Overview
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            The ARIA Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Experience the next generation of document management and AI-powered insights. 
            Built for scale, designed for simplicity, engineered for the future.
          </p>
          <Button size="lg" className="group">
            Explore Features
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>

        {/* Architecture Overview */}
        <motion.div className="mb-20" variants={itemVariants}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Architecture</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on modern cloud infrastructure with microservices architecture for maximum 
              scalability, reliability, and performance.
            </p>
          </div>
          
          <div className="relative bg-card rounded-2xl p-8 border shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Frontend Layer</h3>
                <p className="text-sm text-muted-foreground">
                  React, TypeScript, and modern web technologies for blazing-fast user experiences.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cpu className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">AI Processing Layer</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced ML models and neural networks for document understanding and intelligence.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Data Layer</h3>
                <p className="text-sm text-muted-foreground">
                  Distributed databases with real-time synchronization and enterprise-grade security.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div className="mb-20" variants={itemVariants}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the powerful features that make ARIA the most advanced document management platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {feature.icon}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 border"
          variants={itemVariants}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using ARIA to revolutionize their document management 
            and unlock the power of AI-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="group">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Platform;