import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Search, Loader2, Brain, Zap, Sparkles, Globe, Copy, ExternalLink, CheckCircle, AlertCircle, ChevronRight, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Citation {
  id: number;
  doc_id: string;
  title: string;
  page: number | null;
  snippet: string;
  similarity: number;
}

interface Verification {
  model: string;
  supported: boolean | null;
  notes: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  citations?: Citation[];
  verification?: Verification;
  search_results_count?: number;
}

interface ContextFilter {
  org_id?: string;
  room_id?: string;
  doc_ids?: string[];
}

const MODEL_OPTIONS = [
  { 
    value: 'openai', 
    label: 'GPT-5', 
    icon: Zap,
    description: "OpenAI's most advanced model",
    badge: 'Default',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  { 
    value: 'google', 
    label: 'Gemini 2.0 Flash', 
    icon: Sparkles,
    description: "Google's fastest and most efficient model",
    badge: 'fast',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  { 
    value: 'anthropic', 
    label: 'Claude 3.5 Sonnet', 
    icon: Brain,
    description: "Anthropic's balanced model",
    badge: 'advanced',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  { 
    value: 'perplexity', 
    label: 'Sonar Perplexity Pro', 
    icon: Globe,
    description: "Perplexity's fast model",
    badge: 'real-time',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
];

export default function ARIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [userPrefsLoaded, setUserPrefsLoaded] = useState(false);
  const [verifierEnabled, setVerifierEnabled] = useState(false);
  const [contextFilter, setContextFilter] = useState<ContextFilter>({});
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Parse URL parameters for context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const docIds = urlParams.get('doc_ids');
    if (docIds) {
      setContextFilter(prev => ({
        ...prev,
        doc_ids: docIds.split(',')
      }));
    }
  }, []);

  // Load user preferences
  useEffect(() => {
    if (user && !userPrefsLoaded) {
      loadUserPreferences();
    }
  }, [user, userPrefsLoaded]);

  // Focus on slash key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_prefs')
        .select('aria_model, verifier_enabled')
        .eq('user_id', user!.id)
        .single();

      if (data && !error) {
        setSelectedModel(data.aria_model);
        setVerifierEnabled(data.verifier_enabled || false);
      }
      setUserPrefsLoaded(true);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setUserPrefsLoaded(true);
    }
  };

  const saveUserPreferences = async (updates: Partial<{ aria_model: string; verifier_enabled: boolean }>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_prefs')
        .upsert({ 
          user_id: user.id,
          ...updates
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  const logQuery = async (query: string, model: string, citations: Citation[] = []) => {
    if (!user) return;

    try {
      const modelOption = MODEL_OPTIONS.find(m => m.value === model);
      const inputHash = await hashString(query);
      const outputHash = await hashString(JSON.stringify(citations));

      await supabase
        .from('ai_audit_log')
        .insert({
          user_id: user.id,
          model_provider: model,
          model_name: modelOption?.description || model,
          query: query,
          inputs_hash: inputHash,
          outputs_hash: outputHash,
          citations: JSON.parse(JSON.stringify(citations)),
          source_doc_ids: citations.map(c => c.doc_id),
          org_id: contextFilter.org_id || null,
          room_id: contextFilter.room_id || null
        });
    } catch (error) {
      console.error('Error logging query:', error);
    }
  };

  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    saveUserPreferences({ aria_model: model });
  };

  const handleVerifierToggle = (enabled: boolean) => {
    setVerifierEnabled(enabled);
    saveUserPreferences({ verifier_enabled: enabled });
  };

  const handleContextFilterChange = (filter: Partial<ContextFilter>) => {
    setContextFilter(prev => ({ ...prev, ...filter }));
  };

  const removeContextFilter = (key: keyof ContextFilter) => {
    setContextFilter(prev => {
      const newFilter = { ...prev };
      delete newFilter[key];
      return newFilter;
    });
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the query edge function with context and verifier settings
      const { data, error } = await supabase.functions.invoke('query', {
        body: { 
          question: queryText,
          model: selectedModel,
          org_id: contextFilter.org_id || user?.id || '',
          room_id: contextFilter.room_id || null,
          doc_ids: contextFilter.doc_ids || null,
          verifier: verifierEnabled
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: data.answer || 'No response received',
        timestamp: new Date(),
        model: MODEL_OPTIONS.find(m => m.value === selectedModel)?.label,
        citations: data.citations || [],
        verification: data.verification || null,
        search_results_count: data.search_results_count || 0
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the query with results
      await logQuery(queryText, selectedModel, data.citations || []);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedModelOption = MODEL_OPTIONS.find(m => m.value === selectedModel);
  const ModelIcon = selectedModelOption?.icon || Brain;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareAnswer = async (message: Message) => {
    try {
      const { data, error } = await supabase.functions.invoke('qa-share', {
        body: {
          org_id: contextFilter.org_id || user?.id || '',
          room_id: contextFilter.room_id || null,
          expires_in_hours: 24
        }
      });

      if (error) throw error;

      toast({
        title: "Share link created",
        description: "Answer-only share link copied to clipboard",
      });

      await copyToClipboard(data.share_url);
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ARIA
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Advanced Reasoning and Information Assistant
            </p>
          </div>

          {/* Context Selector */}
          {(contextFilter.org_id || contextFilter.room_id || contextFilter.doc_ids) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Context:</span>
              {contextFilter.org_id && (
                <Badge variant="secondary" className="gap-1">
                  Org: {contextFilter.org_id.substring(0, 8)}...
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeContextFilter('org_id')} />
                </Badge>
              )}
              {contextFilter.room_id && (
                <Badge variant="secondary" className="gap-1">
                  Room: {contextFilter.room_id}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeContextFilter('room_id')} />
                </Badge>
              )}
              {contextFilter.doc_ids && (
                <Badge variant="secondary" className="gap-1">
                  {contextFilter.doc_ids.length} selected files
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeContextFilter('doc_ids')} />
                </Badge>
              )}
            </div>
          )}

          {/* Main Search Interface */}
          <div className="space-y-6">
            <div className="relative">
              <div className="bg-card/80 backdrop-blur-sm border rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                  
                  {/* Search Icon */}
                  <div className="pt-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Input Area */}
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask anything about your documents…"
                      className="w-full min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Model Selector & Submit */}
                  <div className="flex items-center gap-3 pt-2">
                     <Select value={selectedModel} onValueChange={handleModelChange}>
                       <SelectTrigger className="w-64">
                         <div className="flex items-center gap-2">
                           <ModelIcon className="h-4 w-4" />
                           <div className="flex items-center gap-2">
                             <span>{selectedModelOption?.label}</span>
                             <span className={`px-2 py-0.5 text-xs rounded-full ${selectedModelOption?.badgeColor}`}>
                               {selectedModelOption?.badge}
                             </span>
                           </div>
                         </div>
                       </SelectTrigger>
                       <SelectContent className="w-80">
                         {MODEL_OPTIONS.map((model) => {
                           const Icon = model.icon;
                           return (
                             <SelectItem key={model.value} value={model.value} className="py-3">
                               <div className="flex items-center justify-between w-full">
                                 <div className="flex items-center gap-3">
                                   <Icon className="h-5 w-5 text-muted-foreground" />
                                   <div className="flex flex-col">
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium">{model.label}</span>
                                       <span className={`px-2 py-0.5 text-xs rounded-full ${model.badgeColor}`}>
                                         {model.badge}
                                       </span>
                                     </div>
                                     <span className="text-xs text-muted-foreground mt-0.5">
                                       {model.description}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                     </Select>

                    <Button 
                      onClick={handleSubmit} 
                      disabled={!inputValue.trim() || isLoading}
                      className="px-6"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Verifier Toggle */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={verifierEnabled}
                      onCheckedChange={handleVerifierToggle}
                    />
                    <span className="text-sm text-muted-foreground">Cross-check answer</span>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ModelIcon className="h-3 w-3" />
                    <span>Using {selectedModelOption?.label} ({selectedModelOption?.description})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Press / to focus</span>
                    <span>Enter to submit • Shift+Enter for new line</span>
                  </div>
                </div>
              </div>
            </div>

              {/* Messages Area */}
              {messages.length > 0 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-3">
                      <div className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl rounded-2xl p-4 ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground ml-12' 
                            : 'bg-card border shadow-sm mr-12'
                        }`}>
                          {message.type === 'assistant' && (
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ModelIcon className="h-3 w-3" />
                                <span>{message.model}</span>
                                {message.search_results_count !== undefined && (
                                  <span>• {message.search_results_count} sources</span>
                                )}
                              </div>
                              {message.verification && (
                                <Badge 
                                  variant={message.verification.supported ? "default" : "destructive"}
                                  className="gap-1"
                                >
                                  {message.verification.supported ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                  {message.verification.supported ? 'Verified' : 'Flagged'}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="whitespace-pre-wrap text-sm leading-relaxed mb-4">
                            {message.content}
                          </div>

                          {/* Citations */}
                          {message.citations && message.citations.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t">
                              <h4 className="text-xs font-medium text-muted-foreground">Sources</h4>
                              <div className="space-y-2">
                                {message.citations.map((citation) => (
                                  <Card key={citation.id} className="p-3">
                                    <CardContent className="p-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                              [{citation.id}]
                                            </Badge>
                                            <span className="font-medium text-sm truncate">
                                              {citation.title}
                                            </span>
                                            {citation.page && (
                                              <span className="text-xs text-muted-foreground">
                                                Page {citation.page}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {citation.snippet}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 flex-shrink-0"
                                          onClick={() => {
                                            // Open document in workspace at specific page
                                            window.open(`/workspace?doc=${citation.doc_id}&page=${citation.page}`, '_blank');
                                          }}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Verification Details */}
                          {message.verification && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-start gap-2">
                                <div className="flex items-center gap-1">
                                  {message.verification.supported ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="text-xs font-medium">
                                    Verification ({message.verification.model})
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {message.verification.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(message.content)}
                                className="gap-1"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShareAnswer(message)}
                                className="gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Share
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card border shadow-sm rounded-2xl p-4 mr-12">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}