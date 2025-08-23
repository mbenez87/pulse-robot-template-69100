import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, AlertTriangle, Zap, Upload, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ContractAnalysisView from "@/components/contracts/ContractAnalysisView";
import ObligationTracker from "@/components/contracts/ObligationTracker";
import RevenueForecast from "@/components/contracts/RevenueForecast";
import SchemaAutoSuggest from "@/components/contracts/SchemaAutoSuggest";

const Contracts = () => {
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  
  // Fetch contract extractions
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['contract-extractions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_extractions')
        .select(`
          *,
          documents!inner (
            id,
            file_name,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch upcoming obligations
  const { data: upcomingObligations } = useQuery({
    queryKey: ['upcoming-obligations'],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const { data, error } = await supabase
        .from('contract_obligations')
        .select('*')
        .eq('status', 'pending')
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch work queue items
  const { data: workQueue } = useQuery({
    queryKey: ['work-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const getRiskBadgeColor = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "outline";
    if (score >= 40) return "secondary";
    return "default";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return "destructive";
      case 'high': return "destructive";
      case 'medium': return "outline";
      case 'low': return "secondary";
      default: return "default";
    }
  };

  if (selectedContract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contract Analysis</h1>
            <p className="text-muted-foreground">
              Detailed contract analysis and insights
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedContract(null)}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <ContractAnalysisView contractId={selectedContract} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered contract analysis, obligations tracking, and revenue forecasting
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Analyzed contracts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Contracts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts?.filter(c => c.risk_score >= 70).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk score ≥ 70
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Obligations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingObligations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Queue</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workQueue?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pending tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="obligations">Obligations</TabsTrigger>
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="schema">Schema Auto-Suggest</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Analysis</CardTitle>
              <CardDescription>
                AI-powered extraction of key terms, risk assessment, and structured data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contracts && contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedContract(contract.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{contract.documents.file_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Parties: {contract.parties.primary_party} ↔ {contract.parties.counterparty}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Analyzed {new Date(contract.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRiskBadgeColor(contract.risk_score)}>
                          Risk: {contract.risk_score}
                        </Badge>
                        <Badge variant="outline">
                          {contract.extraction_model}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contracts analyzed yet. Upload your first contract to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obligations">
          <ObligationTracker />
        </TabsContent>

        <TabsContent value="forecast">
          <RevenueForecast />
        </TabsContent>

        <TabsContent value="schema">
          <SchemaAutoSuggest />
        </TabsContent>
      </Tabs>

      {/* Upcoming Obligations Summary */}
      {upcomingObligations && upcomingObligations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Obligations
            </CardTitle>
            <CardDescription>
              Key deadlines and requirements due in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingObligations.map((obligation) => (
                <div key={obligation.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{obligation.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(obligation.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityColor(obligation.priority)}>
                      {obligation.priority}
                    </Badge>
                    <Badge variant="outline">
                      {obligation.obligation_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Contracts;