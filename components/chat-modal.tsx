'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth, useUser } from '@clerk/nextjs';
import ConfirmationDialog from './confirmation-dialog';

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(
  'https://dkmaapjiqiqyxbjyshky.supabase.co',
  key
);

type Message = {
  message_id: number;
  text: string;
  user: string;
  created_at: string;
  message_type?: string;
  confirmation_data?: {
    date: string;
    location: string;
    response?: string;
  };
};

type ChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  listingTitle: string;
  uncollapseTrigger?: number;
  openConfirmationTrigger?: number;
};

export default function ChatModal({ isOpen, onClose, conversationId, listingTitle, uncollapseTrigger, openConfirmationTrigger }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset collapsed state when modal is opened, conversation changes, or uncollapseTrigger changes
  useEffect(() => {
    if (isOpen && uncollapseTrigger !== undefined) {
      setIsCollapsed(false);
    }
  }, [isOpen, conversationId, uncollapseTrigger]);

  // Open confirmation dialog when openConfirmationTrigger changes
  useEffect(() => {
    if (isOpen && openConfirmationTrigger !== undefined && openConfirmationTrigger > 0) {
      setShowConfirmationDialog(true);
    }
  }, [isOpen, openConfirmationTrigger]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('message')
        .select('message_id, text, user, created_at, message_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        // Parse confirmation data from JSON in text field
        // Detect confirmation messages by parsing JSON, not by message_type
        const parsedMessages = data.map((msg: any) => {
          try {
            const parsed = JSON.parse(msg.text);
            if (parsed.type === 'confirmation' || parsed.type === 'confirmation_response') {
              return {
                ...msg,
                text: parsed.displayText || msg.text,
                confirmation_data: parsed.type === 'confirmation' ? {
                  date: parsed.date,
                  location: parsed.location,
                  price: parsed.price,
                } : undefined,
                confirmation_response_to: parsed.response_to,
                confirmation_response: parsed.response,
              };
            }
          } catch {
            // If parsing fails, treat as regular text
          }
          return msg;
        });
        setMessages(parsedMessages as Message[]);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Parse confirmation data by checking if text is JSON with confirmation type
          try {
            const parsed = JSON.parse(newMsg.text);
            if (parsed.type === 'confirmation' || parsed.type === 'confirmation_response') {
              const parsedMsg = {
                ...newMsg,
                text: parsed.displayText || newMsg.text,
                confirmation_data: parsed.type === 'confirmation' ? {
                  date: parsed.date,
                  location: parsed.location,
                  price: parsed.price,
                } : undefined,
                confirmation_response_to: parsed.response_to,
                confirmation_response: parsed.response,
              };
              setMessages((prev) => [...prev, parsedMsg as Message]);
            } else {
              setMessages((prev) => [...prev, newMsg as Message]);
            }
          } catch {
            // If parsing fails, treat as regular text message
            setMessages((prev) => [...prev, newMsg as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !conversationId || !text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/chat/[chat_id]/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          user_id: userId,
          chat_id: conversationId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setText("");
      } else {
        alert(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendConfirmation = async (date: string, location: string, price: string) => {
    if (!userId || !conversationId) return;

    setLoading(true);
    try {
      const confirmationText = `Confirmation Request:\nDate: ${date}\nLocation: ${location}\nPrice: ${price}`;
      const response = await fetch(`/chat/[chat_id]/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: confirmationText,
          user_id: userId,
          chat_id: conversationId,
          message_type: "confirmation",
          confirmation_data: {
            date,
            location,
            price,
          },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(result.error || "Failed to send confirmation");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to send confirmation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationResponse = async (messageId: number, responseValue: 'yes' | 'no') => {
    if (!userId || !conversationId) return;

    setLoading(true);
    try {
      const responseText = responseValue === 'yes' ? 'Yes' : 'No';
      const fetchResponse = await fetch(`/chat/[chat_id]/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `Response: ${responseText}`,
          user_id: userId,
          chat_id: conversationId,
          message_type: "confirmation_response",
          confirmation_response_to: messageId,
          confirmation_response: responseValue,
        }),
      });

      const result = await fetchResponse.json();
      if (!result.success) {
        alert(result.error || "Failed to send response");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to send response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
        <Card className="shadow-2xl border-2">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 py-2 px-3">
          <CardTitle className="text-sm font-medium truncate pr-2">Chat: {listingTitle}</CardTitle>
          <div className="flex items-center gap-1 -mt-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-6 w-6 flex-shrink-0 flex items-center justify-center"
              title="Expand chat"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 flex-shrink-0 flex items-center justify-center"
              title="Close chat"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="h-[550px] flex flex-col shadow-2xl border-2">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 py-2 px-3">
          <CardTitle className="text-sm font-medium truncate pr-2">Chat: {listingTitle}</CardTitle>
          <div className="flex items-center gap-1 -mt-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-6 w-6 flex-shrink-0 flex items-center justify-center"
              title="Minimize chat"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 flex-shrink-0 flex items-center justify-center"
              title="Close chat"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.user === userId;
                // Check if message is a confirmation by trying to parse JSON
                let isConfirmation = false;
                try {
                  const parsed = JSON.parse(msg.text);
                  isConfirmation = parsed.type === 'confirmation';
                } catch {
                  isConfirmation = msg.text?.includes('Confirmation Request:');
                }
                
                // Parse confirmation data from text if message_type is confirmation
                let confirmationData = msg.confirmation_data;
                if (isConfirmation && !confirmationData && msg.text) {
                  const dateMatch = msg.text.match(/Date: (.+)/);
                  const locationMatch = msg.text.match(/Location: (.+)/);
                  const priceMatch = msg.text.match(/Price: (.+)/);
                  if (dateMatch && locationMatch) {
                    confirmationData = {
                      date: dateMatch[1],
                      location: locationMatch[1],
                      price: priceMatch ? priceMatch[1] : '',
                    };
                  }
                }

                // Check if this message has been responded to
                const hasResponse = messages.some(m => 
                  m.message_type === 'confirmation_response' && 
                  (m as any).confirmation_response_to === msg.message_id
                );
                const response = hasResponse 
                  ? messages.find(m => 
                      m.message_type === 'confirmation_response' && 
                      (m as any).confirmation_response_to === msg.message_id
                    )?.text?.includes('Yes') ? 'yes' : 'no'
                  : null;

                if (isConfirmation && confirmationData) {
                  return (
                    <div
                      key={msg.message_id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%] rounded-lg bg-white border border-border overflow-hidden">
                        <div className="p-3 space-y-2">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start">
                              <span className="font-medium min-w-[80px]">Date:</span>
                              <span className="flex-1">{confirmationData.date}</span>
                            </div>
                            <div className="flex items-start">
                              <span className="font-medium min-w-[80px]">Location:</span>
                              <span className="flex-1">{confirmationData.location}</span>
                            </div>
                            {confirmationData.price && (
                              <div className="flex items-start">
                                <span className="font-medium min-w-[80px]">Price:</span>
                                <span className="flex-1">{confirmationData.price}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {response ? (
                          <div className="bg-muted px-3 py-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              Response: <span className="font-medium capitalize">{response}</span>
                            </span>
                          </div>
                        ) : !isOwnMessage ? (
                          <div className="bg-muted px-3 py-2 border-t flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleConfirmationResponse(msg.message_id, 'no')}
                              className="flex-1 h-8 text-xs hover:bg-background"
                              disabled={loading}
                            >
                              no
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleConfirmationResponse(msg.message_id, 'yes')}
                              className="flex-1 h-8 text-xs hover:bg-background"
                              disabled={loading}
                            >
                              yes
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-muted px-3 py-2 border-t">
                            <span className="text-xs text-muted-foreground">Waiting for response...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.message_id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-1.5 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input with integrated button */}
          <div className="space-y-2">
            <form onSubmit={handleSubmit} className="relative">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message..."
                className="pr-12"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !text.trim()}
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 border-0 text-white"
                style={{
                  background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmationDialog(true)}
              className="w-full text-xs"
              disabled={loading}
            >
              <CheckCircle className="h-3 w-3 mr-2" />
              Send Confirmation
            </Button>
          </div>
          
          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={showConfirmationDialog}
            onClose={() => setShowConfirmationDialog(false)}
            onSend={handleSendConfirmation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

