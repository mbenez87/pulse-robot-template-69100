import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Download, DollarSign, Calendar, BarChart3, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const RevenueForecast = () => {
  const [selectedContract, setSelectedContract] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch contracts with revenue terms
  const { data: contracts } = useQuery({
    queryKey: ['contracts-with-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_extractions')
        .select(`
          id,
          parties,
          documents!inner (
            file_name
          ),
          revenue_terms!left (
            id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch revenue forecasts for selected contract
  const { data: forecasts, isLoading: forecastsLoading } = useQuery({
    queryKey: ['revenue-forecasts', selectedContract],
    queryFn: async () => {
      if (!selectedContract) return [];
      
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('*')
        .eq('contract_extraction_id', selectedContract)
        .order('forecast_month', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract
  });

  // Fetch revenue terms for selected contract
  const { data: revenueTerms } = useQuery({
    queryKey: ['revenue-terms', selectedContract],
    queryFn: async () => {
      if (!selectedContract) return [];
      
      const { data, error } = await supabase
        .from('revenue_terms')
        .select('*')
        .eq('contract_extraction_id', selectedContract)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract
  });

  // Generate forecast
  const generateForecast = useMutation({
    mutationFn: async (contractId: string) => {
      // First extract revenue terms if not exists
      const { data: termsData, error: termsError } = await supabase.functions.invoke('contract-forecast', {
        body: {
          contractExtractionId: contractId,
          action: 'extract_revenue'
        }
      });
      
      if (termsError) throw termsError;
      
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
        title: "Forecast generated",
        description: "Revenue forecast has been successfully generated.",
      });
      queryClient.invalidateQueries({ queryKey: ['revenue-forecasts'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-terms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate forecast",
        variant: "destructive",
      });
    }
  });

  // Export forecast as CSV
  const exportForecast = useMutation({
    mutationFn: async (contractId: string) => {
      const response = await supabase.functions.invoke('contract-forecast', {
        body: {
          contractExtractionId: contractId,
          action: 'export_csv'
        }
      });
      
      if (response.error) throw response.error;
      
      // Create download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_forecast_${contractId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export completed",
        description: "Revenue forecast exported as CSV.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export forecast",
        variant: "destructive",
      });
    }
  });

  // Calculate totals
  const totalProjectedRevenue = forecasts?.reduce((sum, f) => sum + parseFloat(f.projected_revenue.toString()), 0) || 0;
  const avgMonthlyRevenue = forecasts?.length ? totalProjectedRevenue / forecasts.length : 0;
  const annualRecurringRevenue = parseFloat(forecasts?.[0]?.arr?.toString() || '0');

  // Prepare chart data
  const chartData = forecasts?.map(f => ({
    month: new Date(f.forecast_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: parseFloat(f.projected_revenue.toString()),
    arr: parseFloat(f.arr?.toString() || '0'),
    variance: parseFloat(f.variance_from_previous?.toString() || '0')
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Forecast</h2>
          <p className="text-muted-foreground">
            AI-powered revenue projections from contract terms
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedContract && (
            <>
              <Button
                variant="outline"
                onClick={() => generateForecast.mutate(selectedContract)}
                disabled={generateForecast.isPending}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {generateForecast.isPending ? 'Generating...' : 'Generate Forecast'}
              </Button>
              <Button
                variant="outline"
                onClick={() => exportForecast.mutate(selectedContract)}
                disabled={exportForecast.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contract Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Contract</CardTitle>
          <CardDescription>
            Choose a contract to view or generate revenue forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a contract..." />
            </SelectTrigger>
            <SelectContent>
              {contracts?.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{contract.documents.file_name}</span>
                    <Badge variant={contract.revenue_terms?.length > 0 ? "default" : "secondary"}>
                      {contract.revenue_terms?.length > 0 ? 'Has Forecast' : 'No Forecast'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedContract && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projected (12M)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalProjectedRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Monthly Revenue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${avgMonthlyRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${annualRecurringRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Terms</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {revenueTerms?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {forecasts && forecasts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Projection</CardTitle>
                  <CardDescription>
                    Monthly projected revenue over 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Variance</CardTitle>
                  <CardDescription>
                    Month-over-month revenue changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.slice(1)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Variance']}
                      />
                      <Bar 
                        dataKey="variance" 
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue Terms */}
          {revenueTerms && revenueTerms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Terms</CardTitle>
                <CardDescription>
                  Extracted revenue terms from contract analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product/SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Term</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueTerms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{term.sku}</p>
                            {term.product_name && (
                              <p className="text-sm text-muted-foreground">
                                {term.product_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{term.quantity.toLocaleString()}</TableCell>
                        <TableCell>
                          {term.currency}{term.unit_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {term.billing_frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(term.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {term.term_months ? `${term.term_months} months` : 
                           term.end_date ? `Until ${new Date(term.end_date).toLocaleDateString()}` : 
                           'Ongoing'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Detailed Forecast Table */}
          {forecasts && forecasts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Forecast</CardTitle>
                <CardDescription>
                  Month-by-month revenue projections with variance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastsLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Projected Revenue</TableHead>
                        <TableHead>ARR</TableHead>
                        <TableHead>ACV</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecasts.map((forecast) => (
                        <TableRow key={forecast.id}>
                          <TableCell>
                            {new Date(forecast.forecast_month).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                           <TableCell className="font-medium">
                            ${parseFloat(forecast.projected_revenue.toString()).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ${parseFloat(forecast.arr?.toString() || '0').toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ${parseFloat(forecast.acv?.toString() || '0').toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {forecast.variance_from_previous && (
                              <span className={
                                parseFloat(forecast.variance_from_previous.toString()) >= 0 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }>
                                {parseFloat(forecast.variance_from_previous.toString()) >= 0 ? '+' : ''}
                                ${parseFloat(forecast.variance_from_previous.toString()).toLocaleString()}
                                {forecast.variance_percentage && (
                                  <span className="text-muted-foreground">
                                    {' '}({parseFloat(forecast.variance_percentage).toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(forecast.confidence_score * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {/* AI Narrative */}
                {forecasts[0]?.ai_narrative && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">AI Analysis Summary</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {forecasts[0].ai_narrative}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!forecasts || forecasts.length === 0) && !forecastsLoading && (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No forecast available</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a revenue forecast to see projections and analysis.
                  </p>
                  <Button
                    onClick={() => generateForecast.mutate(selectedContract)}
                    disabled={generateForecast.isPending}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Forecast
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueForecast;