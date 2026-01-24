'use client';

import { Conversation } from '@/types/chat';
import ConversationListItem from './conversation-list-item';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ConversationSidebarProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

export default function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  className = '',
}: ConversationSidebarProps) {
  return (
    <aside className={`w-full md:w-80 border-r bg-background flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Start browsing listings to connect with sellers
            </p>
            <Button asChild>
              <Link href="/">Browse Listings</Link>
            </Button>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationListItem
              key={conv.conversation_id}
              conversation={conv}
              isSelected={conv.conversation_id === selectedId}
              onClick={() => onSelect(conv.conversation_id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
