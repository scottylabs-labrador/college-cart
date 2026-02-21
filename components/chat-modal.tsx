'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, ChevronDown, ChevronUp, CheckCircle, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
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
    price?: string;
    response?: string;
  };
  confirmation_response_to?: number;
  confirmation_response?: string;
  system_event?: 'confirmation_accepted' | 'confirmation_declined' | 'item_sold';
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
        // Parse JSON-encoded messages into typed Message objects
        const parsedMessages = data.map((msg: any) => {
          try {
            const parsed = JSON.parse(msg.text);
            if (parsed.type === 'confirmation') {
              return {
                ...msg,
                text: parsed.displayText || msg.text,
                confirmation_data: { date: parsed.date, location: parsed.location, price: parsed.price },
              };
            }
            if (parsed.type === 'confirmation_accepted') {
              return {
                ...msg,
                text: '',
                system_event: 'confirmation_accepted' as const,
                confirmation_data: { date: parsed.date, location: parsed.location, price: parsed.price },
                confirmation_response_to: parsed.response_to,
              };
            }
            if (parsed.type === 'confirmation_declined') {
              return {
                ...msg,
                text: '',
                system_event: 'confirmation_declined' as const,
                confirmation_response_to: parsed.response_to,
              };
            }
            if (parsed.type === 'item_sold') {
              return { ...msg, text: '', system_event: 'item_sold' as const };
            }
            // Legacy confirmation_response
            if (parsed.type === 'confirmation_response') {
              return {
                ...msg,
                text: parsed.displayText || msg.text,
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
          // Parse message data by checking if text is JSON with a known type
          try {
            const parsed = JSON.parse(newMsg.text);
            if (parsed.type === 'confirmation') {
              const parsedMsg = {
                ...newMsg,
                text: parsed.displayText || newMsg.text,
                confirmation_data: { date: parsed.date, location: parsed.location, price: parsed.price },
              };
              setMessages((prev) => [...prev, parsedMsg as Message]);
            } else if (parsed.type === 'confirmation_accepted') {
              const parsedMsg = {
                ...newMsg,
                text: '',
                system_event: 'confirmation_accepted' as const,
                confirmation_data: { date: parsed.date, location: parsed.location, price: parsed.price },
                confirmation_response_to: parsed.response_to,
              };
              setMessages((prev) => [...prev, parsedMsg as Message]);
            } else if (parsed.type === 'confirmation_declined') {
              const parsedMsg = {
                ...newMsg,
                text: '',
                system_event: 'confirmation_declined' as const,
                confirmation_response_to: parsed.response_to,
              };
              setMessages((prev) => [...prev, parsedMsg as Message]);
            } else if (parsed.type === 'item_sold') {
              const parsedMsg = { ...newMsg, text: '', system_event: 'item_sold' as const };
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

                {/* ── System event: confirmation accepted ── */}
                if (msg.system_event === 'confirmation_accepted') {
                  return (
                    <div key={msg.message_id} className="flex justify-center my-3">
                      <div className="w-full max-w-[90%] rounded-lg border border-green-200 bg-green-50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border-b border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-green-800">Sale Confirmed</span>
                        </div>
                        {msg.confirmation_data && (() => {
                          const d = msg.confirmation_data;
                          // Parse the date string (e.g. "Sat, Feb 14, 2026 at 2:30 PM" or just "Sat, Feb 14, 2026")
                          const atIdx = d.date.indexOf(' at ');
                          const datePart = atIdx !== -1 ? d.date.substring(0, atIdx) : d.date;
                          const timePart = atIdx !== -1 ? d.date.substring(atIdx + 4) : null;

                          let startDate = new Date(datePart);
                          if (isNaN(startDate.getTime())) startDate = new Date();

                          if (timePart) {
                            const match = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                            if (match) {
                              let h = parseInt(match[1]);
                              const m = parseInt(match[2]);
                              const ap = match[3].toUpperCase();
                              if (ap === 'PM' && h !== 12) h += 12;
                              if (ap === 'AM' && h === 12) h = 0;
                              startDate.setHours(h, m, 0, 0);
                            }
                          }

                          const pad = (n: number) => n.toString().padStart(2, '0');
                          const toCalStr = (dt: Date) =>
                            `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

                          const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
                          const dates = `${toCalStr(startDate)}/${toCalStr(endDate)}`;

                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE`
                            + `&text=${encodeURIComponent(`CollegeCart ${listingTitle} Meeting`)}`
                            + `&dates=${dates}`
                            + `&location=${encodeURIComponent(d.location || '')}`
                            + `&ctz=America/New_York`;

                          return (
                            <div className="px-3 py-2 space-y-0.5 text-xs text-green-900">
                              <div className="flex">
                                <span className="font-medium min-w-[65px]">Date:</span>
                                <span>{d.date}</span>
                              </div>
                              <div className="flex">
                                <span className="font-medium min-w-[65px]">Location:</span>
                                <span>{d.location}</span>
                              </div>
                              {d.price && (
                                <div className="flex">
                                  <span className="font-medium min-w-[65px]">Price:</span>
                                  <span>{d.price}</span>
                                </div>
                              )}
                              <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1 text-green-700 underline hover:text-green-900"
                              >
                                Add to Google Calendar
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                }

                {/* ── System event: confirmation declined ── */}
                if (msg.system_event === 'confirmation_declined') {
                  return (
                    <div key={msg.message_id} className="flex justify-center my-2">
                      <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1">
                        <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-red-700">Confirmation declined</span>
                      </div>
                    </div>
                  );
                }

                {/* ── System event: item sold ── */}
                if (msg.system_event === 'item_sold') {
                  return (
                    <div key={msg.message_id} className="flex justify-center my-3">
                      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                        <ShoppingBag className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-800">This item has already been sold</span>
                      </div>
                    </div>
                  );
                }

                {/* ── Confirmation request card ── */}
                let isConfirmation = false;
                try {
                  const parsed = JSON.parse(msg.text);
                  isConfirmation = parsed.type === 'confirmation';
                } catch {
                  isConfirmation = msg.text?.includes('Confirmation Request:');
                }
                
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

                // Check if this confirmation has been accepted or declined
                const acceptedMsg = messages.find(m =>
                  m.system_event === 'confirmation_accepted' &&
                  m.confirmation_response_to === msg.message_id
                );
                const declinedMsg = messages.find(m =>
                  m.system_event === 'confirmation_declined' &&
                  m.confirmation_response_to === msg.message_id
                );
                const responseStatus: 'accepted' | 'declined' | null =
                  acceptedMsg ? 'accepted' : declinedMsg ? 'declined' : null;

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
                        {responseStatus === 'accepted' ? (
                          <div className="bg-green-50 px-3 py-2 border-t border-green-200">
                            <span className="text-xs font-medium text-green-700">Accepted</span>
                          </div>
                        ) : responseStatus === 'declined' ? (
                          <div className="bg-red-50 px-3 py-2 border-t border-red-200">
                            <span className="text-xs font-medium text-red-700">Declined</span>
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
                              No
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleConfirmationResponse(msg.message_id, 'yes')}
                              className="flex-1 h-8 text-xs hover:bg-background"
                              disabled={loading}
                            >
                              Yes
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

                {/* ── Regular text message ── */}
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

          {/* Input — disabled when item is sold */}
          {messages.some(m => m.system_event === 'item_sold') ? (
            <div className="text-center text-xs text-muted-foreground py-2">
              This conversation is no longer active.
            </div>
          ) : (
            <div className="space-y-2">
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  disabled={loading}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden max-h-32"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                />
                <Button
                  type="submit"
                  disabled={loading || !text.trim()}
                  size="icon"
                  className="absolute right-1 bottom-1.5 h-8 w-8 border-0 text-white"
                  style={{
                    background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {!messages.some(m => m.system_event === 'confirmation_accepted') && (
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
              )}
            </div>
          )}
          
          {/* Confirmation Dialog */}
          {!messages.some(m => m.system_event === 'confirmation_accepted') && (
            <ConfirmationDialog
              isOpen={showConfirmationDialog}
              onClose={() => setShowConfirmationDialog(false)}
              onSend={handleSendConfirmation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

