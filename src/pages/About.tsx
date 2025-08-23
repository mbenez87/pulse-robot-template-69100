import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8 pt-24 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">About Signal87 AI</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transforming unstructured data into actionable insights through advanced AI-driven document intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We empower organizations to unlock the hidden value in their documents through cutting-edge AI technology. 
                Our platform bridges the gap between raw data and meaningful insights, enabling smarter decision-making.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Leveraging multiple AI models including GPT-5, Claude Sonnet, and Gemini, we provide comprehensive 
                document analysis, intelligent search, and contextual insights across your entire knowledge base.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Our ARIA AI agent provides sophisticated document querying capabilities, combining internal knowledge 
                with external data sources through Perplexity integration for comprehensive research and analysis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure & Scalable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Built with enterprise-grade security and scalability in mind, our platform ensures your sensitive 
                documents remain protected while providing lightning-fast access to insights when you need them.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Why Choose Signal87 AI?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Multi-AI Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Access to multiple leading AI models for diverse analytical perspectives
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-2">Intelligent Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced document understanding with context-aware insights
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-2">Seamless Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Easy-to-use interface that fits naturally into your workflow
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}