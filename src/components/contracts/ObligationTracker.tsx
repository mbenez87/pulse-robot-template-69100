import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CheckCircle, Clock, AlertTriangle, Mail, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ObligationTracker = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const queryClient = useQueryClient();

  // Fetch obligations
  const { data: obligations, isLoading } = useQuery({
    queryKey: ['contract-obligations', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('contract_obligations')
        .select(`
          *,
          contract_extractions!inner (
            id,
            parties,
            documents!inner (
              file_name
            )
          )
        `)
        .order('due_date', { ascending: true });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch work queue
  const { data: workQueue } = useQuery({
    queryKey: ['work-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_queue')
        .select('*')
        .eq('task_type', 'obligation_reminder')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Check for due obligations and generate reminders
  const checkDueObligations = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('obligation-copilot', {
        body: {
          action: 'check_due'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Obligation check completed",
        description: `${data.reminders_created || 0} new reminders created for upcoming obligations.`,
      });
      queryClient.invalidateQueries({ queryKey: ['work-queue'] });
      queryClient.invalidateQueries({ queryKey: ['contract-obligations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check due obligations",
        variant: "destructive",
      });
    }
  });

  // Mark obligation as completed
  const markCompleted = useMutation({
    mutationFn: async (obligationId: string) => {
      const { error } = await supabase
        .from('contract_obligations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', obligationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Obligation completed",
        description: "The obligation has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ['contract-obligations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update obligation",
        variant: "destructive",
      });
    }
  });

  // Complete work queue item
  const completeWorkItem = useMutation({
    mutationFn: async (workItemId: string) => {
      const { error } = await supabase
        .from('work_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', workItemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Task completed",
        description: "The work item has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ['work-queue'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work item",
        variant: "destructive",
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return "destructive";
      case 'high': return "destructive";
      case 'medium': return "outline";
      case 'low': return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return "default";
      case 'in_progress': return "outline";
      case 'overdue': return "destructive";
      case 'pending': return "secondary";
      default: return "outline";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDaysUntilDue = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Obligation Tracker</h2>
          <p className="text-muted-foreground">
            Monitor contract obligations, deadlines, and automated reminders
          </p>
        </div>
        <Button
          onClick={() => checkDueObligations.mutate()}
          disabled={checkDueObligations.isPending}
        >
          <Clock className="mr-2 h-4 w-4" />
          {checkDueObligations.isPending ? 'Checking...' : 'Check Due Obligations'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Obligations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {obligations?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {obligations?.filter(o => {
                const days = getDaysUntilDue(o.due_date);
                return days >= 0 && days <= 7 && o.status === 'pending';
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {obligations?.filter(o => {
                const days = getDaysUntilDue(o.due_date);
                return days < 0 && o.status === 'pending';
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Queue</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workQueue?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="obligations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="obligations">Obligations</TabsTrigger>
          <TabsTrigger value="work-queue">Work Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="obligations" className="space-y-4">
          {/* Status Filter */}
          <div className="flex space-x-2">
            {['pending', 'in_progress', 'completed', 'overdue', 'all'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contract Obligations</CardTitle>
              <CardDescription>
                Track all contractual obligations and their due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : obligations && obligations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {obligations.map((obligation) => {
                      const daysUntilDue = getDaysUntilDue(obligation.due_date);
                      const isOverdue = daysUntilDue < 0 && obligation.status === 'pending';
                      
                      return (
                        <TableRow key={obligation.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{obligation.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {obligation.obligation_type.replace('_', ' ')}
                                {obligation.threshold_amount && (
                                  ` • $${obligation.threshold_amount}`
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {obligation.contract_extractions.documents.file_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(obligation.contract_extractions.parties as any)?.primary_party || 'Not specified'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                                {new Date(obligation.due_date).toLocaleDateString()}
                              </p>
                              <p className={`text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {formatDaysUntilDue(daysUntilDue)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(obligation.priority)}>
                              {obligation.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(obligation.status)}>
                              {obligation.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {obligation.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markCompleted.mutate(obligation.id)}
                                disabled={markCompleted.isPending}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No obligations found for the selected status.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Queue</CardTitle>
              <CardDescription>
                AI-generated tasks and reminders for contract obligations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workQueue && workQueue.length > 0 ? (
                <div className="space-y-4">
                  {workQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        {item.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </p>
                        )}
                        {item.email_draft && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer text-primary">
                              View Email Draft
                            </summary>
                            <div className="mt-2 p-3 bg-muted rounded text-sm">
                              <pre className="whitespace-pre-wrap font-sans">
                                {item.email_draft}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeWorkItem.mutate(item.id)}
                          disabled={completeWorkItem.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending work items. Run obligation check to generate new reminders.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObligationTracker;