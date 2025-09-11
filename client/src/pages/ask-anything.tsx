import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, Send } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

export default function AskAnything() {
  const [currentMessage, setCurrentMessage] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: messages = [], refetch } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    retry: false,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/send", { message });
      return response.json();
    },
    onSuccess: () => {
      setCurrentMessage("");
      refetch();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      sendMessage.mutate(currentMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-foreground">Loading...</div>
    </div>;
  }

  return (
    <div className="h-screen w-full flex">
      <Sidebar />
      
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto custom-scrollbar bg-background/50">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">Ask Anything</h2>
                <p className="text-muted-foreground">Get instant answers powered by AI</p>
              </div>

              {/* Chat Interface */}
              <GlassCard className="overflow-hidden">
                {/* Chat Messages */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar" data-testid="chat-messages">
                  {/* Initial AI greeting */}
                  {messages.length === 0 && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-foreground">
                            Hello! I'm here to help you with any questions about Narayani Sena, spiritual practices, or general inquiries. What would you like to know?
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {messages.map((msg: ChatMessage) => (
                    <div key={msg.id} className="space-y-4">
                      {/* User Message */}
                      <div className="flex gap-3 justify-end">
                        <div className="flex-1 max-w-xs">
                          <div className="bg-primary/20 rounded-lg p-4 ml-auto">
                            <p className="text-sm text-foreground">{msg.message}</p>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center flex-shrink-0">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                      </div>

                      {/* AI Response */}
                      {msg.response && (
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm text-foreground">{msg.response}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {sendMessage.isPending && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-foreground">Thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-border">
                  <div className="flex gap-3">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your question here..."
                      className="flex-1 bg-muted/30 border-input"
                      disabled={sendMessage.isPending}
                      data-testid="input-message"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || sendMessage.isPending}
                      className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Quick Templates */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setCurrentMessage("What are the main teachings of Mahaprabhuji?")}
                    className="p-4 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-border hover:border-primary/40 transition-all"
                    data-testid="template-spiritual-guidance"
                  >
                    <h4 className="font-medium text-foreground mb-1">Spiritual Guidance</h4>
                    <p className="text-sm text-muted-foreground">Ask about spiritual practices and teachings</p>
                  </button>
                  <button 
                    onClick={() => setCurrentMessage("What community events are coming up?")}
                    className="p-4 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-border hover:border-primary/40 transition-all"
                    data-testid="template-community-events"
                  >
                    <h4 className="font-medium text-foreground mb-1">Community Events</h4>
                    <p className="text-sm text-muted-foreground">Get information about upcoming events</p>
                  </button>
                  <button 
                    onClick={() => setCurrentMessage("How can I contribute to the community?")}
                    className="p-4 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-border hover:border-primary/40 transition-all"
                    data-testid="template-general-help"
                  >
                    <h4 className="font-medium text-foreground mb-1">General Help</h4>
                    <p className="text-sm text-muted-foreground">Any other questions or assistance</p>
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
