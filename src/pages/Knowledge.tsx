import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Upload, 
  Search, 
  Shield, 
  Share2, 
  Key, 
  FileText, 
  Eye, 
  EyeOff,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  description: string;
  answer_only_mode: boolean;
  settings: any;
  created_at: string;
}

interface ShareToken {
  token: string;
  shareUrl: string;
  expiresAt: string;
  permissions: any;
}

export default function Knowledge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  
  // API Key Management
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    perplexity: ''
  });
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    perplexity: false
  });

  const loadRooms = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    }
  };

  const createRoom = async () => {
    if (!user || !newRoomName.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          description: newRoomDescription,
          org_id: user.id, // Using user.id as org_id for simplicity
          owner_id: user.id,
          answer_only_mode: false,
          settings: {}
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setRooms([data, ...rooms]);
      setNewRoomName('');
      setNewRoomDescription('');
      
      toast({
        title: "Success",
        description: "Room created successfully"
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswerOnlyMode = async (roomId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ answer_only_mode: enabled })
        .eq('id', roomId);
      
      if (error) throw error;
      
      setRooms(rooms.map(room => 
        room.id === roomId 
          ? { ...room, answer_only_mode: enabled }
          : room
      ));
      
      toast({
        title: "Success",
        description: `Answer-only mode ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: "Error",
        description: "Failed to update room settings",
        variant: "destructive"
      });
    }
  };

  const createShareToken = async (roomId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-room-token', {
        body: { 
          roomId,
          expiresInHours: 24,
          permissions: { query_only: true }
        }
      });
      
      if (error) throw error;
      
      setShareToken(data);
      
      toast({
        title: "Success",
        description: "Share link created successfully"
      });
    } catch (error) {
      console.error('Error creating share token:', error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard"
    });
  };

  const processDocument = async (documentId: string, roomId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ocr-extract', {
        body: { 
          documentId,
          roomId,
          orgId: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Document processed: ${data.chunksProcessed} chunks created`
      });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async (service: string, key: string) => {
    if (!user || !key.trim()) return;
    
    try {
      // In a real implementation, you'd encrypt the key before storing
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          org_id: user.id,
          service_name: service,
          key_hash: btoa(key), // Basic encoding - use proper encryption in production
          created_by: user.id
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${service.toUpperCase()} API key saved`
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access the Knowledge suite.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Knowledge Suite</h1>
          <p className="text-muted-foreground">
            Security-aware AI search with citations, OCR, smart redaction, and room-scoped Q&A
          </p>
        </div>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms">
              <FileText className="h-4 w-4 mr-2" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search & Q&A
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-description">Description</Label>
                    <Input
                      id="room-description"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
                <Button onClick={createRoom} disabled={isLoading || !newRoomName.trim()}>
                  Create Room
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        {room.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {room.answer_only_mode && (
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            Answer-Only
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createShareToken(room.id)}
                          disabled={isLoading}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`answer-only-${room.id}`}>Answer-Only Mode</Label>
                        <Switch
                          id={`answer-only-${room.id}`}
                          checked={room.answer_only_mode}
                          onCheckedChange={(checked) => toggleAnswerOnlyMode(room.id, checked)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(room.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {shareToken && (
              <Card>
                <CardHeader>
                  <CardTitle>Share Link Created</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input value={shareToken.shareUrl} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(shareToken.shareUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(shareToken.shareUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(shareToken.expiresAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Search & Q&A</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use the main Search page for AI-powered document queries with citations.
                  Room-scoped search ensures users only access authorized content.
                </p>
                <Button onClick={() => window.location.href = '/search'}>
                  <Search className="h-4 w-4 mr-2" />
                  Go to Search
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <AlertTriangle className="h-5 w-5 mr-2 inline" />
                  PII/PHI Detection & Redaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automatic detection of sensitive information using AI and regex patterns.
                  Preview redaction masks before applying watermarks and creating redacted copies.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Badge variant="outline">SSN Detection</Badge>
                  <Badge variant="outline">Phone Numbers</Badge>
                  <Badge variant="outline">Email Addresses</Badge>
                  <Badge variant="outline">Credit Cards</Badge>
                  <Badge variant="outline">Medical Records</Badge>
                  <Badge variant="outline">Addresses</Badge>
                  <Badge variant="outline">AI-Powered</Badge>
                  <Badge variant="outline">Custom Patterns</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Key className="h-5 w-5 mr-2 inline" />
                  API Key Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(apiKeys).map(([service, key]) => (
                  <div key={service} className="space-y-2">
                    <Label htmlFor={service}>{service.toUpperCase()} API Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id={service}
                        type={showApiKeys[service as keyof typeof showApiKeys] ? 'text' : 'password'}
                        value={key}
                        onChange={(e) => setApiKeys({ ...apiKeys, [service]: e.target.value })}
                        placeholder={`Enter ${service.toUpperCase()} API key`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKeys({ 
                          ...showApiKeys, 
                          [service]: !showApiKeys[service as keyof typeof showApiKeys] 
                        })}
                      >
                        {showApiKeys[service as keyof typeof showApiKeys] ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveApiKey(service, key)}
                        disabled={!key.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Model Fallback Order</h3>
                  <p className="text-sm text-muted-foreground">
                    The system will try these models in order:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Claude 3.5 Sonnet (Primary for analysis)</li>
                    <li>GPT-4o (Fallback for queries)</li>
                    <li>Gemini Pro (Final fallback)</li>
                    <li>Perplexity Sonar (Web search)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}