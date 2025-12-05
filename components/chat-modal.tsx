'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth, useUser } from '@clerk/nextjs';

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
};

type ChatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  listingTitle: string;
};

export default function ChatModal({ isOpen, onClose, conversationId, listingTitle }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userId } = useAuth();
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('message')
        .select('message_id, text, user, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        setMessages(data as Message[]);
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
          setMessages((prev) => [...prev, payload.new as Message]);
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
        </CardContent>
      </Card>
    </div>
  );
}

