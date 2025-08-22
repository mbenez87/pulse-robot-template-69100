import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { Bot, Send, User, FileText, Globe, Loader2, ChevronDown, Search, Sparkles, Zap, Brain, Filter, Calendar, Tag, UserIcon, Settings, ChevronRight, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  apiUsed?: string;
}

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  tags?: string[];
  ai_summary?: string;
}

interface SearchFilters {
  fileTypes: string[];
  dateRange: { start: string; end: string };
  tags: string[];
  author: string;
}

interface AIParameters {
  responseLength: number;
  reasoningDepth: number;
  creativity: number;
}

const ARIA_MODELS = {
  gpt5: { name: "GPT-5", icon: Zap, description: "Latest OpenAI flagship model" },
  claude: { name: "Claude Sonnet 4", icon: Brain, description: "Advanced reasoning AI" },
  gemini: { name: "Gemini 2.5 Pro", icon: Sparkles, description: "Google's latest AI model" },
  perplexity: { name: "Perplexity Sonar", icon: Globe, description: "Real-time web search" }
} as const;

export default function ARIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<keyof typeof ARIA_MODELS>("gpt5");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    fileTypes: [],
    dateRange: { start: '', end: '' },
    tags: [],
    author: ''
  });
  const [aiParams, setAiParams] = useState<AIParameters>({
    responseLength: 500,
    reasoningDepth: 50,
    creativity: 70
  });
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserDocuments();
    // Add welcome message
    setMessages([{
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Hello! I'm ARIA, your integrated AI assistant. I can help you with:\n\n• Analyzing your documents with advanced filters\n• Searching the web for current information\n• Answering questions using multiple AI models\n• Providing insights based on your specific parameters\n\nUse the advanced search options to fine-tune your queries!",
      timestamp: new Date()
    }]);
  }, []);

  // Filter documents based on search criteria
  useEffect(() => {
    let filtered = documents;

    // Filter by file type
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(doc => 
        filters.fileTypes.some(type => doc.file_type.toLowerCase().includes(type.toLowerCase()))
      );
    }

    // Filter by date range
    if (filters.dateRange.start) {
      filtered = filtered.filter(doc => 
        new Date(doc.created_at) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(doc => 
        new Date(doc.created_at) <= new Date(filters.dateRange.end)
      );
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(doc => 
        doc.tags && doc.tags.some(tag => 
          filters.tags.some(filterTag => tag.toLowerCase().includes(filterTag.toLowerCase()))
        )
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, filters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, file_type, created_at, tags, ai_summary")
        .eq("user_id", user.id)
        .eq("is_folder", false);

      if (error) throw error;
      const docs = data || [];
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      let response;
      let functionName = "";

      switch (selectedModel) {
        case "perplexity":
          functionName = "perplexity-search";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              query: inputValue,
              includeImages: false,
              recencyFilter: 'month'
            }
          });
          break;
        case "claude":
          functionName = "claude-chat";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              message: inputValue,
              documents: filteredDocuments.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary,
                type: doc.file_type,
                created_at: doc.created_at
              })),
              parameters: aiParams
            }
          });
          break;
        case "gpt5":
          functionName = "gpt5-chat";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              message: inputValue,
              documents: filteredDocuments.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary,
                type: doc.file_type,
                created_at: doc.created_at
              })),
              parameters: aiParams
            }
          });
          break;
        case "gemini":
          functionName = "gemini-chat";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              message: inputValue,
              documents: filteredDocuments.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary,
                type: doc.file_type,
                created_at: doc.created_at
              })),
              parameters: aiParams
            }
          });
          break;
      }

      if (response?.error) {
        throw new Error(response.error.message || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: selectedModel === "perplexity" ? response.data.content : response.data.response,
        timestamp: new Date(),
        apiUsed: ARIA_MODELS[selectedModel].name
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
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
      handleSendMessage();
    }
  };

  const ModelIcon = ARIA_MODELS[selectedModel].icon;

  const resetFilters = () => {
    setFilters({
      fileTypes: [],
      dateRange: { start: '', end: '' },
      tags: [],
      author: ''
    });
    setAiParams({
      responseLength: 500,
      reasoningDepth: 50,
      creativity: 70
    });
  };

  const getAvailableFileTypes = () => {
    const types = [...new Set(documents.map(doc => doc.file_type))];
    return types.filter(Boolean);
  };

  const getAvailableTags = () => {
    const allTags = documents.flatMap(doc => doc.tags || []);
    return [...new Set(allTags)];
  };

  return (
    <div className="container mx-auto max-w-7xl p-6 h-[calc(100vh-80px)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                ARIA Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label className="text-sm font-medium mb-2 block">AI Model</label>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(ARIA_MODELS[selectedModel].icon, { className: "h-4 w-4" })}
                    <span className="font-medium">{ARIA_MODELS[selectedModel].name}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 p-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      {Object.entries(ARIA_MODELS)
                        .filter(([_, model]) => 
                          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map(([key, model]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedModel(key as keyof typeof ARIA_MODELS);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors text-left ${
                              selectedModel === key ? 'bg-primary/10 border border-primary/20' : ''
                            }`}
                          >
                            {React.createElement(model.icon, { 
                              className: `h-5 w-5 ${selectedModel === key ? 'text-primary' : 'text-muted-foreground'}` 
                            })}
                            <div>
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-muted-foreground">{model.description}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Filtered Documents ({filteredDocuments.length}/{documents.length})</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filteredDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{doc.file_name}</div>
                        <div className="text-xs text-muted-foreground">{doc.file_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      
      {/* Advanced Search Filters */}
      <div className="lg:col-span-4 mb-4">
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Search & AI Parameters
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* File Filters */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Document Filters
                      </h3>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">File Types</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {getAvailableFileTypes().map(type => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={filters.fileTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      fileTypes: [...prev.fileTypes, type]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      fileTypes: prev.fileTypes.filter(t => t !== type)
                                    }));
                                  }
                                }}
                              />
                              <label htmlFor={`type-${type}`} className="text-sm">
                                {type.toUpperCase()}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Date Range</label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            placeholder="Start date"
                            value={filters.dateRange.start}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value }
                            }))}
                          />
                          <Input
                            type="date"
                            placeholder="End date"
                            value={filters.dateRange.end}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Tags</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {getAvailableTags().map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={filters.tags.includes(tag)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      tags: [...prev.tags, tag]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      tags: prev.tags.filter(t => t !== tag)
                                    }));
                                  }
                                }}
                              />
                              <label htmlFor={`tag-${tag}`} className="text-sm">
                                {tag}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Parameters */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Parameters
                      </h3>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Response Length: {aiParams.responseLength} words
                        </label>
                        <Slider
                          value={[aiParams.responseLength]}
                          onValueChange={([value]) => setAiParams(prev => ({
                            ...prev,
                            responseLength: value
                          }))}
                          max={2000}
                          min={100}
                          step={50}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Reasoning Depth: {aiParams.reasoningDepth}%
                        </label>
                        <Slider
                          value={[aiParams.reasoningDepth]}
                          onValueChange={([value]) => setAiParams(prev => ({
                            ...prev,
                            reasoningDepth: value
                          }))}
                          max={100}
                          min={10}
                          step={10}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Creativity: {aiParams.creativity}%
                        </label>
                        <Slider
                          value={[aiParams.creativity]}
                          onValueChange={([value]) => setAiParams(prev => ({
                            ...prev,
                            creativity: value
                          }))}
                          max={100}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Query Enhancement */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Query Context
                      </h3>
                      
                      <div className="text-sm space-y-2">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <strong>Active Filters:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            {filters.fileTypes.length > 0 && (
                              <li>• File types: {filters.fileTypes.join(", ")}</li>
                            )}
                            {filters.dateRange.start && (
                              <li>• From: {filters.dateRange.start}</li>
                            )}
                            {filters.dateRange.end && (
                              <li>• To: {filters.dateRange.end}</li>
                            )}
                            {filters.tags.length > 0 && (
                              <li>• Tags: {filters.tags.join(", ")}</li>
                            )}
                            {filters.fileTypes.length === 0 && !filters.dateRange.start && !filters.dateRange.end && filters.tags.length === 0 && (
                              <li>• No filters applied</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <strong>AI Settings:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Length: {aiParams.responseLength} words</li>
                            <li>• Depth: {aiParams.reasoningDepth}%</li>
                            <li>• Creativity: {aiParams.creativity}%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

        {/* Chat Interface */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ModelIcon className="h-5 w-5" />
                Chat with {ARIA_MODELS[selectedModel].name}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0">
                        {message.type === 'user' ? (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.apiUsed && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {message.apiUsed}
                          </Badge>
                        )}
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-muted-foreground">ARIA is thinking...</div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ARIA about your ${filteredDocuments.length} filtered documents or search the web...`}
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}