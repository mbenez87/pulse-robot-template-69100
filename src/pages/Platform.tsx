import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Search, Brain, Users, Shield, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollVectors from "@/components/ScrollVectors";

interface FeatureCardProps {
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  index: number;
}

const FeatureCard = ({ icon, tag, title, description, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={cardRef}
      className={cn(
        "feature-card glass-card opacity-0 p-4 sm:p-6",
        "lg:hover:bg-gradient-to-br lg:hover:from-white lg:hover:to-pulse-50",
        "transition-all duration-300"
      )}
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-full bg-pulse-50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-pulse-500">
          {icon}
        </div>
        <Badge variant="outline" className="text-xs text-pulse-600 border-pulse-200">
          {tag}
        </Badge>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{title}</h3>
      <p className="text-gray-600 text-sm sm:text-base">{description}</p>
    </div>
  );
};

const Platform = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(".fade-in-element");
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add("animate-fade-in");
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "File Management",
      title: "Seamless File Management",
      description: "Upload, organize, and secure your documents in one place with folders, search, and intuitive organization."
    },
    {
      icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "AI-Powered",
      title: "AI-Powered Summaries",
      description: "Every document is instantly summarized so you get the key points at a glance without reading the full content."
    },
    {
      icon: <Search className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "Multi-Model AI",
      title: "Meet ARIA",
      description: "Your built-in multi-model AI agent connected to Sonar (Perplexity), Claude Sonnet, GPT-5, and Gemini."
    },
    {
      icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "Smart Search",
      title: "Intelligent Search",
      description: "Combine natural language queries with filters by type, date, tag, or author for precise results."
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "Security",
      title: "Private Workspaces",
      description: "Each account is fully isolated; new users begin with a clean workspace for complete privacy."
    },
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      tag: "Onboarding",
      title: "Simple Onboarding",
      description: "Start with a 3-day free trial; continue with a subscription once it expires."
    }
  ];

  return (
    <div className="relative min-h-screen pt-16">
      <ScrollVectors />

      {/* Hero Section */}
      <section className="relative z-10 section-container pt-16 pb-10" ref={sectionRef}>
        <div className="text-center">
          <div className="pulse-chip mx-auto mb-3 sm:mb-6 opacity-0 fade-in-element">
            <span>Platform</span>
          </div>
          <h1 className="section-title mb-3 sm:mb-4 opacity-0 fade-in-element">
            Your Digital Workspace,<br className="hidden sm:block" /> Supercharged by AI
          </h1>
          <p className="section-subtitle mx-auto opacity-0 fade-in-element">
            Seamless file management with AI-powered summaries and ARIA — your built-in multi-model agent.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 sm:mt-8 opacity-0 fade-in-element">
            <Button className="button-primary group" asChild>
              <Link to="/auth">
                Start 3-Day Trial
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" className="button-secondary" asChild>
              <Link to="/contact">
                Talk to Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="relative z-10 section-container pb-16">
        <Card className="glass-card p-3 shadow-elegant">
          <img 
            src="/assets/platform-screenshot.png" 
            alt="Platform UI" 
            className="rounded-xl w-full"
            onError={(e) => {
              // Fallback to existing image if screenshot doesn't exist
              e.currentTarget.src = "/public/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png";
            }}
          />
        </Card>
        <p className="text-sm text-muted-foreground mt-2 text-center">A clean, empty workspace for new accounts.</p>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 section-container pb-20">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="section-title mb-3 sm:mb-4">Key Capabilities</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              tag={feature.tag}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* ARIA Section */}
      <section className="relative z-10 section-container pb-24">
        <Card className="glass-card p-6 sm:p-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl sm:text-3xl font-display">
              ARIA: Advanced Reasoning & Insight Agent
            </CardTitle>
            <CardDescription className="text-base sm:text-lg mt-3">
              Unified access to Sonar (Perplexity), Claude Sonnet, GPT-5, and Gemini. Ask natural questions, run
              grounded searches, and synthesize answers from your documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pulse-500 mt-2 flex-shrink-0"></div>
                <span>Model selector with per-query controls (length, temperature, reasoning depth).</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pulse-500 mt-2 flex-shrink-0"></div>
                <span>Compound input: NL query + filters (type, date, tag, author).</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pulse-500 mt-2 flex-shrink-0"></div>
                <span>Responses blend AI reasoning with doc citations and mini-summaries.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pulse-500 mt-2 flex-shrink-0"></div>
                <span>Secure, per-user isolation across storage, queries, and outputs.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 section-container pb-28">
        <Card className="bg-gradient-to-r from-pulse-500 to-pulse-600 text-white border-0 p-6 sm:p-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl sm:text-3xl font-display text-white">
              Ready to try it?
            </CardTitle>
            <CardDescription className="text-white/90 text-base sm:text-lg mt-2">
              Sign up for a 3-day trial. After expiry, continue via subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Button className="bg-white text-pulse-600 hover:bg-gray-50 font-medium py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" asChild>
              <Link to="/auth">
                Create Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Platform;