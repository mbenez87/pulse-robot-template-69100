import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Linkedin, Mail, Shield, Search, Zap, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-20 space-y-8 md:space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
            <h1 className="section-title text-foreground">About Signal87 AI</h1>
            <p className="section-subtitle">
              Transforming unstructured data into actionable insights through advanced, document-aware AI.
            </p>
          </div>
        </div>

        {/* Mission & How It Works */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We empower organizations to unlock the hidden value in their documents through cutting-edge AI technology. 
                Our platform bridges the gap between raw data and meaningful insights, enabling smarter decision-making across teams.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">1</div>
                  <span className="text-sm">Upload documents to your secure workspace</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">2</div>
                  <span className="text-sm">AI understands content via OCR + embeddings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">3</div>
                  <span className="text-sm">Ask questions in ARIA's natural search</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">4</div>
                  <span className="text-sm">Act on insights with cited sources</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Advantages */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Platform Advantages</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Search className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Simple by design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Perplexity-style search interface with minimal clicks and maximum clarity.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Zap className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Model-smart</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Auto-routes to Claude, GPT-5, Gemini, or Sonar with manual override options.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Answers with proof</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every response includes citations that open exact pages in Dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Security first</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  RLS policies, redaction, watermarking, and comprehensive AI audit logs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Founders Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Founders</h2>
            <p className="text-muted-foreground">
              Experienced operators building document-aware AI for real work.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Michael Benezra */}
            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-24 h-24 md:w-28 md:h-28">
                    <AvatarImage src="/lovable-uploads/fe4cc13c-618a-49ab-ac51-f8ce8eb8828f.png" alt="Michael Benezra" />
                    <AvatarFallback className="text-xl font-semibold">MB</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Michael Benezra</h3>
                    <p className="text-sm font-medium text-primary mb-3">Chief Executive Officer</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Former enterprise software leader with deep expertise in AI product strategy, 
                      partnerships, and scaling document intelligence solutions for complex organizations.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      <Badge variant="outline" className="text-xs">Vision</Badge>
                      <Badge variant="outline" className="text-xs">Partnerships</Badge>
                      <Badge variant="outline" className="text-xs">Product Strategy</Badge>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jai Amin */}
            <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-24 h-24 md:w-28 md:h-28">
                    <AvatarImage src="/lovable-uploads/d4203b1a-42ef-4b65-b804-44a3ced04f61.png" alt="Jai Amin" />
                    <AvatarFallback className="text-xl font-semibold">JA</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Jai Amin</h3>
                    <p className="text-sm font-medium text-primary mb-3">Chief Information Officer</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Systems architect and data security expert specializing in multi-model AI orchestration, 
                      enterprise-grade infrastructure, and privacy-preserving document processing workflows.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      <Badge variant="outline" className="text-xs">Architecture</Badge>
                      <Badge variant="outline" className="text-xs">Data Security</Badge>
                      <Badge variant="outline" className="text-xs">AI Orchestration</Badge>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust & Compliance */}
        <Card className="rounded-2xl border bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Trust & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Built with enterprise-grade security featuring organization and room-level permissions, 
              answer-only sharing capabilities, document watermarking, and comprehensive auditability. 
              All data processing adheres to strict privacy standards with transparent logging of AI interactions.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/aria">
                <Search className="w-4 h-4 mr-2" />
                Open ARIA
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <Users className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}