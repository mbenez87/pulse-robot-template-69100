import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, AlertTriangle, TrendingUp, Users, Calendar, DollarSign, Shield, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContractAnalysisViewProps {
  contractId: string;
}

const ContractAnalysisView = ({ contractId }: ContractAnalysisViewProps) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'summary'>('json');
  const queryClient = useQueryClient();

  // Fetch contract extraction details
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract-extraction', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_extractions')
        .select(`
          *,
          documents!inner (
            id,
            file_name,
            storage_path,
            created_at
          )
        `)
        .eq('id', contractId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Generate obligations from contract
  const generateObligations = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('obligation-copilot', {
        body: {
          contractExtractionId: contractId,
          action: 'extract'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Obligations extracted",
        description: "Contract obligations have been successfully identified and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['contract-obligations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extract obligations",
        variant: "destructive",
      });
    }
  });

  // Generate revenue forecast
  const generateForecast = useMutation({
    mutationFn: async () => {
      // First extract revenue terms
      const { data: revenueData, error: revenueError } = await supabase.functions.invoke('contract-forecast', {
        body: {
          contractExtractionId: contractId,
          action: 'extract_revenue'
        }
      });
      
      if (revenueError) throw revenueError;
      
      // Then generate forecast
      const { data: forecastData, error: forecastError } = await supabase.functions.invoke('contract-forecast', {
        body: {
          contractExtractionId: contractId,
          action: 'generate_forecast',
          forecastMonths: 12
        }
      });
      
      if (forecastError) throw forecastError;
      return forecastData;
    },
    onSuccess: () => {
      toast({
        title: "Revenue forecast generated",
        description: "Revenue terms and 12-month forecast have been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['revenue-forecasts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate revenue forecast",
        variant: "destructive",
      });
    }
  });

  const exportContract = () => {
    if (!contract) return;
    
    if (exportFormat === 'json') {
      const exportData = {
        contract_analysis: contract,
        export_date: new Date().toISOString(),
        export_format: 'json'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_analysis_${contract.documents.file_name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Generate summary export with safe property access
      const parties = contract.parties as any || {};
      const termDetails = contract.term_details as any || {};
      const pricing = contract.pricing as any || {};
      
      const summary = `
Contract Analysis Summary
Generated: ${new Date().toLocaleDateString()}
File: ${contract.documents.file_name}

PARTIES:
Primary Party: ${parties.primary_party || 'Not specified'}
Counterparty: ${parties.counterparty || 'Not specified'}
Other Parties: ${parties.other_parties?.join(', ') || 'None'}

TERM DETAILS:
Start Date: ${termDetails.start_date || 'Not specified'}
End Date: ${termDetails.end_date || 'Not specified'}
Term Length: ${termDetails.term_length || 'Not specified'}
Auto Renewal: ${termDetails.auto_renewal ? 'Yes' : 'No'}

PRICING:
Amount: ${pricing.currency || '$'}${pricing.amount || 'Not specified'}
Payment Terms: ${pricing.payment_terms || 'Not specified'}

RISK ASSESSMENT:
Risk Score: ${contract.risk_score}/100
Risk Level: ${contract.risk_score >= 70 ? 'High' : contract.risk_score >= 40 ? 'Medium' : 'Low'}
Rationale: ${contract.risk_rationale}

ANALYSIS MODEL: ${contract.extraction_model}
CONFIDENCE: ${(contract.extraction_confidence * 100).toFixed(1)}%
      `;
      
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_summary_${contract.documents.file_name}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Export completed",
      description: `Contract analysis exported as ${exportFormat.toUpperCase()}`,
    });
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "outline";
    if (score >= 40) return "secondary";
    return "default";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Contract not found</h3>
            <p className="text-muted-foreground">The requested contract analysis could not be loaded.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe property access
  const parties = contract.parties as any || {};
  const termDetails = contract.term_details as any || {};
  const pricing = contract.pricing as any || {};
  const renewalTerms = contract.renewal_terms as any || {};
  const terminationClauses = contract.termination_clauses as any || {};
  const ipProvisions = contract.ip_provisions as any || {};
  const governingLaw = contract.governing_law as any || {};
  const liabilityCap = contract.liability_cap as any || {};
  const indemnityClause = contract.indemnity_clauses as any || {};

  return (
    <div className="space-y-6">
      {/* Header with file info and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">{contract.documents.file_name}</h2>
            <p className="text-muted-foreground">
              Analyzed on {new Date(contract.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => generateObligations.mutate()}
            disabled={generateObligations.isPending}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {generateObligations.isPending ? 'Extracting...' : 'Extract Obligations'}
          </Button>
          <Button
            variant="outline"
            onClick={() => generateForecast.mutate()}
            disabled={generateForecast.isPending}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {generateForecast.isPending ? 'Generating...' : 'Generate Forecast'}
          </Button>
          <Button onClick={exportContract}>
            <Download className="mr-2 h-4 w-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* Risk Assessment Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contract.risk_score}</div>
            <div className="flex items-center space-x-2">
              <Badge variant={getRiskBadgeColor(contract.risk_score)}>
                {getRiskLevel(contract.risk_score)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pricing.currency || '$'}{pricing.amount || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {pricing.payment_terms || 'Terms not specified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Term</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termDetails.term_length || 'Not specified'}
            </div>
            <p className="text-xs text-muted-foreground">
              {termDetails.auto_renewal ? 'Auto-renewing' : 'Fixed term'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Model</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{contract.extraction_model}</div>
            <p className="text-xs text-muted-foreground">
              {(contract.extraction_confidence * 100).toFixed(1)}% confidence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="legal">Legal Provisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Primary Party</h4>
                  <p className="text-muted-foreground">{parties.primary_party || 'Not specified'}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Counterparty</h4>
                  <p className="text-muted-foreground">{parties.counterparty || 'Not specified'}</p>
                </div>
                {parties.other_parties && Array.isArray(parties.other_parties) && parties.other_parties.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Other Parties</h4>
                      <ul className="text-muted-foreground space-y-1">
                        {parties.other_parties.map((party: string, index: number) => (
                          <li key={index}>• {party}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Term Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Start Date</h4>
                    <p className="text-muted-foreground">
                      {termDetails.start_date || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">End Date</h4>
                    <p className="text-muted-foreground">
                      {termDetails.end_date || 'Not specified'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Term Length</h4>
                  <p className="text-muted-foreground">
                    {termDetails.term_length || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Auto Renewal</h4>
                  <Badge variant={termDetails.auto_renewal ? "default" : "secondary"}>
                    {termDetails.auto_renewal ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Pricing & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Contract Value</h4>
                  <p className="text-muted-foreground">
                    {pricing.currency || '$'}{pricing.amount || 'Not specified'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Payment Terms</h4>
                  <p className="text-muted-foreground">
                    {pricing.payment_terms || 'Not specified'}
                  </p>
                </div>
                {pricing.escalations && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Escalations</h4>
                      <p className="text-muted-foreground">{pricing.escalations}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Renewal & Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renewalTerms && Object.keys(renewalTerms).length > 0 && (
                  <div>
                    <h4 className="font-medium">Renewal Terms</h4>
                    <p className="text-muted-foreground">
                      Notice Period: {renewalTerms.notice_period || 'Not specified'}
                    </p>
                    {renewalTerms.renewal_conditions && (
                      <p className="text-muted-foreground mt-2">
                        Conditions: {renewalTerms.renewal_conditions}
                      </p>
                    )}
                  </div>
                )}
                
                {terminationClauses && Object.keys(terminationClauses).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Termination Rights</h4>
                      <p className="text-muted-foreground">
                        {terminationClauses.termination_rights || 'Not specified'}
                      </p>
                      {terminationClauses.notice_periods && (
                        <p className="text-muted-foreground mt-2">
                          Notice: {terminationClauses.notice_periods}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold">Overall Risk Score</h3>
                  <p className="text-muted-foreground">{contract.risk_rationale}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{contract.risk_score}</div>
                  <Badge variant={getRiskBadgeColor(contract.risk_score)} className="mt-2">
                    {getRiskLevel(contract.risk_score)} Risk
                  </Badge>
                </div>
              </div>

              {contract.unusual_clauses && Array.isArray(contract.unusual_clauses) && contract.unusual_clauses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Unusual Clauses</h4>
                  <div className="space-y-3">
                    {contract.unusual_clauses.map((clause: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="font-medium">{clause.description || 'Unusual clause detected'}</p>
                        {clause.risk_level && (
                          <Badge variant={clause.risk_level === 'high' ? "destructive" : "outline"} className="mt-2">
                            {clause.risk_level} risk
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="mr-2 h-5 w-5" />
                  Governing Law
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Jurisdiction</h4>
                  <p className="text-muted-foreground">
                    {governingLaw.jurisdiction || 'Not specified'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium">Dispute Resolution</h4>
                  <p className="text-muted-foreground">
                    {governingLaw.dispute_resolution || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Venue</h4>
                  <p className="text-muted-foreground">
                    {governingLaw.venue || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liability & Indemnity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {liabilityCap && Object.keys(liabilityCap).length > 0 && (
                  <div>
                    <h4 className="font-medium">Liability Cap</h4>
                    <p className="text-muted-foreground">
                      {liabilityCap.currency || '$'}{liabilityCap.cap_amount || 'Not specified'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mutual caps: {liabilityCap.mutual_caps ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
                
                {indemnityClause && Object.keys(indemnityClause).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium">Indemnification</h4>
                      <p className="text-muted-foreground">
                        {indemnityClause.scope || 'Standard indemnification clauses apply'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractAnalysisView;