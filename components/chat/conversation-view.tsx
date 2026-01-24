'use client';

import { useState, useEffect } from 'react';
import { Message, Conversation } from '@/types/chat';
import ChatMessageList from './chat-message-list';
import ChatInput from './chat-input';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient('https://dkmaapjiqiqyxbjyshky.supabase.co', key);

type ConversationViewProps = {
  conversationId: string | null;
  userId: string;
  conversations: Conversation[];
  onBack?: () => void;
  className?: string;
};

export default function ConversationView({
  conversationId,
  userId,
  conversations,
  onBack,
  className = '',
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const currentConversation = conversations.find(c => c.conversation_id === conversationId);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('message')
        .select('message_id, text, user, created_at, message_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        // Parse confirmation data from JSON in text field
        const parsedMessages = data.map((msg: {
          message_id: number;
          text: string;
          user: string;
          created_at: string;
          message_type?: string;
        }) => {
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
          const newMsg = payload.new as {
            message_id: number;
            text: string;
            user: string;
            created_at: string;
            message_type?: string;
          };
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
  }, [conversationId]);

  const handleSendMessage = async (text: string) => {
    if (!userId || !conversationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/chat/[chat_id]/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          user_id: userId,
          chat_id: conversationId,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to send message. Please try again.');
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: confirmationText,
          user_id: userId,
          chat_id: conversationId,
          message_type: 'confirmation',
          confirmation_data: {
            date,
            location,
            price,
          },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(result.error || 'Failed to send confirmation');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to send confirmation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationResponse = async (messageId: number, responseValue: 'yes' | 'no') => {
    if (!userId || !conversationId) return;

    setLoading(true);
    try {
      const responseText = responseValue === 'yes' ? 'Yes' : 'No';
      const response = await fetch(`/chat/[chat_id]/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Response: ${responseText}`,
          user_id: userId,
          chat_id: conversationId,
          message_type: 'confirmation_response',
          confirmation_response_to: messageId,
          confirmation_response: responseValue,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(result.error || 'Failed to send response');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to send response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Empty state when no conversation selected
  if (!conversationId) {
    return (
      <div className={`flex-1 flex items-center justify-center p-8 text-center ${className}`}>
        <div>
          <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground">
            Choose a conversation from the sidebar to view messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {/* Header with back button for mobile */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{currentConversation?.listing_title || 'Chat'}</h2>
          {currentConversation && (
            <p className="text-sm text-muted-foreground">
              ${(currentConversation.listing_price_cents / 100).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <ChatMessageList
          messages={messages}
          userId={userId}
          loading={loading}
          onConfirmationResponse={handleConfirmationResponse}
        />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput
          conversationId={conversationId}
          userId={userId}
          loading={loading}
          onSend={handleSendMessage}
          onSendConfirmation={handleSendConfirmation}
        />
      </div>
    </div>
  );
}
