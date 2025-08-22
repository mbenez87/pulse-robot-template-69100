import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Team = () => {
  const teamMembers = [
    {
      name: "Michael Benezra",
      role: "CEO",
      linkedin: "https://www.linkedin.com/in/michaelbenezra/"
    },
    {
      name: "Jai Amin", 
      role: "CIO",
      linkedin: "https://www.linkedin.com/in/jaiamin04/"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Meet the leadership driving innovation and excellence
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {member.name}
                </h3>
                
                <Badge variant="secondary" className="mb-6">
                  {member.role}
                </Badge>
                
                <Button 
                  asChild
                  variant="outline" 
                  className="group-hover:border-primary group-hover:text-primary transition-colors"
                >
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;