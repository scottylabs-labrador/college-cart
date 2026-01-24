'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/types/chat';
import ConversationSidebar from '@/components/chat/conversation-sidebar';
import ConversationView from '@/components/chat/conversation-view';
import { createClient } from '@supabase/supabase-js';

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient('https://dkmaapjiqiqyxbjyshky.supabase.co', key);

type ChatPageClientProps = {
  initialConversations: Conversation[];
  userId: string;
  initialSelectedId?: string | null;
};

export default function ChatPageClient({
  initialConversations,
  userId,
  initialSelectedId = null,
}: ChatPageClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialSelectedId);

  // Subscribe to new conversations
  useEffect(() => {
    const channel = supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation',
        },
        async (payload) => {
          const newConv = payload.new as { buyer_id: string; seller_id: string };
          // Only add if user is buyer or seller
          if (newConv.buyer_id === userId || newConv.seller_id === userId) {
            // Fetch full conversation data with listing info
            const response = await fetch('/chat/api/conversations');
            const data = await response.json();
            if (data.success) {
              setConversations(data.conversations);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Subscribe to message updates to refresh conversation list (for last message preview)
  useEffect(() => {
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
        },
        async () => {
          // Update conversations to refresh last message
          const response = await fetch('/chat/api/conversations');
          const data = await response.json();
          if (data.success) {
            setConversations(data.conversations);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Update URL
    router.push(`/chat/${conversationId}`);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    router.push('/chat');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar - hide on mobile when conversation selected */}
      <ConversationSidebar
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        className={selectedConversationId ? 'hidden md:flex' : 'flex'}
      />

      {/* Chat view - hide on mobile when no conversation selected */}
      <ConversationView
        conversationId={selectedConversationId}
        userId={userId}
        conversations={conversations}
        onBack={handleBack}
        className={!selectedConversationId ? 'hidden md:flex' : 'flex'}
      />
    </div>
  );
}
