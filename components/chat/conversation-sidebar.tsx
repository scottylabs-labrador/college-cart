'use client';

import { Conversation } from '@/types/chat';
import { useState } from 'react';
import { isConversationUnread } from '@/lib/chat-read-state';
import ConversationListItem from './conversation-list-item';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ConversationSidebarProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  userId: string;
  lastReadTimestamps: Record<string, string>;
};

export default function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  className = '',
  userId,
  lastReadTimestamps,
}: ConversationSidebarProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'buying') return conv.user_role === 'buyer';
    return conv.user_role === 'seller';
  });

  return (
    <aside className={`w-full md:w-80 border-r bg-background flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <h2 className="text-xl font-semibold">Messages</h2>
        <div className="flex items-center gap-2">
          {(['all', 'buying', 'selling'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'buying' ? 'Buying' : 'Selling'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            {conversations.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Start browsing listings to connect with sellers
                </p>
                <Button asChild>
                  <Link href="/">Browse Listings</Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No matches in this tab</h3>
                <p className="text-muted-foreground text-sm">
                  Try switching to a different filter
                </p>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const hasUnread = isConversationUnread(conv, userId, lastReadTimestamps);

            return (
              <ConversationListItem
                key={conv.conversation_id}
                conversation={conv}
                isSelected={conv.conversation_id === selectedId}
                onClick={() => onSelect(conv.conversation_id)}
                hasUnread={hasUnread}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}
