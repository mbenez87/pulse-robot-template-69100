import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, User, FileText, Globe, Loader2 } from "lucide-react";
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
  ai_summary?: string;
}

const ARIA_MODELS = {
  perplexity: { name: "Sonar (Perplexity)", icon: Globe, description: "Real-time web search" },
  claude: { name: "Claude Sonnet", icon: Bot, description: "Advanced reasoning" },
  gpt5: { name: "GPT-5", icon: Bot, description: "Latest OpenAI model" },
  gemini: { name: "Google Gemini", icon: Bot, description: "Google's AI model" }
} as const;

export default function ARIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<keyof typeof ARIA_MODELS>("perplexity");
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
      content: "Hello! I'm ARIA, your integrated AI assistant. I can help you with:\n\n• Analyzing your documents\n• Searching the web for current information\n• Answering questions using multiple AI models\n\nWhat would you like to explore today?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, ai_summary")
        .eq("user_id", user.id)
        .eq("is_folder", false);

      if (error) throw error;
      setDocuments(data || []);
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
              documents: documents.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary
              }))
            }
          });
          break;
        case "gpt5":
          functionName = "gpt5-chat";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              message: inputValue,
              documents: documents.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary
              }))
            }
          });
          break;
        case "gemini":
          functionName = "gemini-chat";
          response = await supabase.functions.invoke(functionName, {
            body: { 
              message: inputValue,
              documents: documents.map(doc => ({
                name: doc.file_name,
                summary: doc.ai_summary
              }))
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

  return (
    <div className="container mx-auto max-w-6xl p-6 h-[calc(100vh-80px)]">
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
              <div>
                <label className="text-sm font-medium mb-2 block">AI Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ARIA_MODELS).map(([key, model]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <model.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Documents ({documents.length})</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs truncate">{doc.file_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    placeholder="Ask ARIA anything about your documents or search the web..."
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