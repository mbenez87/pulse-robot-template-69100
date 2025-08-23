import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, Search, Loader2, ChevronRight, X, Copy, ExternalLink, CheckCircle, AlertCircle, Code, Globe, FileText, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import openaiLogo from "@/assets/openai-logo.svg";
import geminiLogo from "@/assets/gemini-logo.svg";
import claudeLogo from "@/assets/claude-logo.png";
import perplexityLogo from "@/assets/perplexity-logo.png";

interface Citation {
  id: number;
  doc_id: string;
  title: string;
  page: number | null;
  snippet: string;
  similarity: number;
}

interface WebResult {
  url: string;
  title: string;
  snippet: string;
}

interface CodeOutput {
  files: Array<{ path: string; content: string }>;
  commands?: string[];
  tests?: string;
  output?: string;
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
  mode?: 'docs' | 'web' | 'hybrid' | 'code';
  citations?: Citation[];
  webResults?: WebResult[];
  codeOutput?: CodeOutput;
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
    logo: openaiLogo,
    description: "OpenAI's most advanced model",
    badge: 'Default',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  { 
    value: 'google', 
    label: 'Gemini 2.0 Flash', 
    logo: geminiLogo,
    description: "Google's fastest and most efficient model",
    badge: 'fast',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  { 
    value: 'anthropic', 
    label: 'Claude 3.5 Sonnet', 
    logo: claudeLogo,
    description: "Anthropic's balanced model",
    badge: 'advanced',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  { 
    value: 'perplexity', 
    label: 'Sonar Pro', 
    logo: perplexityLogo,
    description: "Perplexity's fast model",
    badge: 'real-time',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
];

const MODE_OPTIONS = [
  { value: 'docs', label: 'Docs', icon: FileText, description: 'Search your documents' },
  { value: 'web', label: 'Web', icon: Globe, description: 'Search the web' },
  { value: 'hybrid', label: 'Hybrid', icon: Layers, description: 'Docs + Web' },
  { value: 'code', label: 'Code', icon: Code, description: 'Generate code' }
];

export default function ARIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("openai");
  const [selectedMode, setSelectedMode] = useState<'docs' | 'web' | 'hybrid' | 'code'>('docs');
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

  // Calculate and set header height for sticky positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      const h = (header?.offsetHeight ?? 64) + 8; // 8px breathing room
      document.documentElement.style.setProperty('--nav-h', `${h}px`);
    };

    // Set initial height
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Also update after a short delay to catch any layout changes
    const timeout = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeout);
    };
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_prefs')
        .select('aria_model, aria_mode, verifier_enabled')
        .eq('user_id', user!.id)
        .single();

      if (data && !error) {
        setSelectedModel(data.aria_model);
        const modeValue = data.aria_mode as 'docs' | 'web' | 'hybrid' | 'code';
        setSelectedMode(modeValue && ['docs', 'web', 'hybrid', 'code'].includes(modeValue) ? modeValue : 'docs');
        setVerifierEnabled(data.verifier_enabled || false);
      }
      setUserPrefsLoaded(true);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setUserPrefsLoaded(true);
    }
  };

  const saveUserPreferences = async (updates: Partial<{ aria_model: string; aria_mode: string; verifier_enabled: boolean }>) => {
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

  const logQuery = async (query: string, model: string, mode: string, citations: Citation[] = [], webResults: WebResult[] = []) => {
    if (!user) return;

    try {
      const modelOption = MODEL_OPTIONS.find(m => m.value === model);
      const inputHash = await hashString(query);
      const outputHash = await hashString(JSON.stringify({ citations, webResults }));
      
      const sources = [];
      if (citations.length > 0) sources.push('docs');
      if (webResults.length > 0) sources.push('web');
      if (mode === 'code') sources.push('code');

      await supabase
        .from('ai_audit_log')
        .insert({
          user_id: user.id,
          model_provider: model,
          model_name: modelOption?.description || model,
          query: query,
          mode: mode,
          sources: sources,
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
    // Auto-switch to Perplexity if Web mode is selected with non-web model
    if (selectedMode === 'web' && model !== 'perplexity') {
      setSelectedModel('perplexity');
      saveUserPreferences({ aria_model: 'perplexity' });
      toast({
        title: "Model switched",
        description: "Switched to Perplexity Sonar for web search mode"
      });
    } else {
      setSelectedModel(model);
      saveUserPreferences({ aria_model: model });
    }
  };

  const handleModeChange = (mode: 'docs' | 'web' | 'hybrid' | 'code') => {
    setSelectedMode(mode);
    saveUserPreferences({ aria_mode: mode });
    
    // Auto-switch to Perplexity if Web mode is selected with non-web model
    if (mode === 'web' && selectedModel !== 'perplexity') {
      setSelectedModel('perplexity');
      saveUserPreferences({ aria_model: 'perplexity' });
      toast({
        title: "Model switched",
        description: "Switched to Perplexity Sonar for web search mode"
      });
    }
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
      // Route to the appropriate endpoint based on mode
      let endpoint = 'query';
      let requestBody: any = {
        question: queryText,
        model: selectedModel,
        mode: selectedMode,
        org_id: contextFilter.org_id || user?.id || '',
        room_id: contextFilter.room_id || null,
        doc_ids: contextFilter.doc_ids || null,
        verifier: verifierEnabled
      };

      if (selectedMode === 'code') {
        endpoint = 'code';
        requestBody = {
          instruction: queryText,
          model: selectedModel
        };
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: requestBody
      });

      if (error) {
        // Handle web search failure with automatic fallback
        if (selectedMode === 'web' && (error.message?.includes('provider_error') || error.status >= 400)) {
          toast({
            title: "Web search temporarily unavailable",
            description: "Retrying with Hybrid (docs + citations)...",
            variant: "destructive"
          });
          
          // Automatically retry with hybrid mode
          const hybridResponse = await supabase.functions.invoke('query', {
            body: {
              ...requestBody,
              mode: 'hybrid'
            }
          });
          
          if (hybridResponse.error) throw hybridResponse.error;
          
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            type: 'assistant',
            content: hybridResponse.data.answer || 'No response received',
            timestamp: new Date(),
            model: MODEL_OPTIONS.find(m => m.value === selectedModel)?.label,
            mode: 'hybrid', // Show that we fell back to hybrid
            citations: hybridResponse.data.citations || [],
            webResults: [],
            codeOutput: null,
            verification: hybridResponse.data.verification || null,
            search_results_count: hybridResponse.data.search_results_count || 0
          };

          setMessages(prev => [...prev, assistantMessage]);
          await logQuery(queryText, selectedModel, 'hybrid', hybridResponse.data.citations || [], []);
          return;
        }
        
        throw error;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: data.answer || data.content || 'No response received',
        timestamp: new Date(),
        model: MODEL_OPTIONS.find(m => m.value === selectedModel)?.label,
        mode: selectedMode,
        citations: data.citations || [],
        webResults: data.webResults || [],
        codeOutput: data.codeOutput || null,
        verification: data.verification || null,
        search_results_count: data.search_results_count || 0
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Log the query with results
      await logQuery(queryText, selectedModel, selectedMode, data.citations || [], data.webResults || []);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col pt-[calc(var(--nav-h,72px)+8px)]">
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">

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

          {/* ARIA Hero Section - Sticky below nav */}
          <section className="aria-hero sticky top-[var(--nav-h,72px)] z-10 supports-[padding:max(0px)]:top-[calc(var(--nav-h,72px)+env(safe-area-inset-top))] max-w-3xl mx-auto px-4 md:px-0">
            
            {/* Logo and Title */}
            <div className="text-center space-y-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  ARIA
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Advanced Reasoning and Information Assistant
              </p>
            </div>

            {/* Search Interface */}
            <div className="bg-card/80 backdrop-blur-sm border rounded-2xl shadow-sm p-6">
              <div className="flex flex-col gap-3 md:gap-4">
                
                {/* Search Input with Embedded Send Button */}
                <div className="relative w-full rounded-2xl border bg-white/70 backdrop-blur px-4 py-3 md:py-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                  <div className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-muted-foreground mt-1" />
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        // Auto-grow textarea
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
                        }
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask anything about your documents…"
                      aria-label="Ask anything about your documents"
                      className="w-full resize-none overflow-hidden bg-transparent outline-none leading-relaxed text-base md:text-lg placeholder:text-muted-foreground/60 pr-14 md:pr-16"
                      style={{ height: 'auto', minHeight: '28px' }}
                      disabled={isLoading}
                    />
                    
                    {/* Embedded Send Button */}
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!inputValue.trim() || isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-lg"
                      aria-label="Submit search"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Controls - Row A: Mode Chips Only */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {MODE_OPTIONS.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => handleModeChange(mode.value as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedMode === mode.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Controls - Row B: Model Dropdown + Cross-check (right-aligned under arrow) */}
                <div className="flex justify-end items-center gap-3 mt-1">
                  {/* Model Selector */}
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="min-w-[176px] md:min-w-[200px]">
                      <div className="flex items-center gap-2 w-full">
                        <img src={selectedModelOption?.logo} alt={selectedModelOption?.label} className="h-4 w-4 flex-shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate">{selectedModelOption?.label}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${selectedModelOption?.badgeColor}`}>
                            {selectedModelOption?.badge}
                          </span>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-80">
                      {MODEL_OPTIONS.map((model) => {
                        return (
                          <SelectItem key={model.value} value={model.value} className="py-3">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <img src={model.logo} alt={model.label} className="h-5 w-5" />
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

                  {/* Cross-check Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={verifierEnabled}
                      onCheckedChange={handleVerifierToggle}
                    />
                    <span className="text-sm text-muted-foreground">Cross-check answer</span>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <img src={selectedModelOption?.logo} alt={selectedModelOption?.label} className="h-3 w-3" />
                    <span>Using {selectedModelOption?.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">Press / to focus</span>
                    <span>Enter to submit • Shift+Enter for new line</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Messages Area */}
          {messages.length > 0 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className="space-y-3" style={{ scrollMarginTop: 'calc(var(--nav-h,72px) + 12px)' }}>
                  <div className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl rounded-2xl p-4 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-12' 
                        : 'bg-card border shadow-sm mr-12'
                    }`}>
                      {message.type === 'assistant' && (
                             <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                 <img src={selectedModelOption?.logo} alt={selectedModelOption?.label} className="h-3 w-3" />
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

                          {/* Results Tabs */}
                          {(message.citations?.length > 0 || message.webResults?.length > 0 || message.codeOutput) && (
                            <Tabs defaultValue="documents" className="mt-4">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="documents" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  Documents ({message.citations?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="web" className="gap-1">
                                  <Globe className="h-3 w-3" />
                                  Web ({message.webResults?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="code" className="gap-1">
                                  <Code className="h-3 w-3" />
                                  Code Output
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="documents" className="mt-4">
                                {message.citations && message.citations.length > 0 ? (
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
                                ) : (
                                  <p className="text-sm text-muted-foreground">No document sources found</p>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="web" className="mt-4">
                                {message.webResults && message.webResults.length > 0 ? (
                                  <div className="space-y-2">
                                    {message.webResults.map((result, index) => (
                                      <Card key={index} className="p-3">
                                        <CardContent className="p-0">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                  [{index + 1}]
                                                </Badge>
                                                <span className="font-medium text-sm truncate">
                                                  {result.title}
                                                </span>
                                              </div>
                                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                {result.snippet}
                                              </p>
                                              <a 
                                                href={result.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline truncate block"
                                              >
                                                {result.url}
                                              </a>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 flex-shrink-0"
                                              onClick={() => window.open(result.url, '_blank')}
                                            >
                                              <ExternalLink className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No web sources found</p>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="code" className="mt-4">
                                {message.codeOutput ? (
                                  <div className="space-y-4">
                                    {message.codeOutput.files && message.codeOutput.files.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Files:</h4>
                                        {message.codeOutput.files.map((file, index) => (
                                          <Card key={index} className="p-3">
                                            <CardContent className="p-0">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-sm">{file.path}</span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => copyToClipboard(file.content)}
                                                  className="h-6 px-2"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </Button>
                                              </div>
                                              <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto">
                                                <code>{file.content}</code>
                                              </pre>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {message.codeOutput.commands && (
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Commands:</h4>
                                        <div className="space-y-1">
                                          {message.codeOutput.commands.map((cmd, index) => (
                                            <code key={index} className="block text-xs bg-muted/50 p-2 rounded font-mono">
                                              {cmd}
                                            </code>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {message.codeOutput.output && (
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Output:</h4>
                                        <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto">
                                          <code>{message.codeOutput.output}</code>
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No code output available</p>
                                )}
                              </TabsContent>
                            </Tabs>
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
  );
}