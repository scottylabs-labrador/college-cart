'use client';

import { Conversation } from '@/types/chat';
import { Badge } from '@/components/ui/badge';

type ConversationListItemProps = {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  hasUnread?: boolean;
};

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return '';

  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  hasUnread = false,
}: ConversationListItemProps) {
  const isSeller = conversation.user_role === 'seller';

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer p-4 border-b border-l-4 transition-colors
        ${isSeller
          ? 'border-l-purple-600 bg-purple-50/30 hover:bg-purple-50/50'
          : 'border-l-green-600 bg-green-50/30 hover:bg-green-50/50'
        }
        ${isSelected ? 'bg-muted' : ''}
      `}
    >
      <div className="space-y-2">
        {/* Header with title and badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasUnread && (
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm truncate">
              {conversation.listing_title}
            </h3>
          </div>
          <Badge
            className={`
              text-xs flex-shrink-0
              ${isSeller
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-green-100 text-green-800 border-green-300'
              }
            `}
            variant="outline"
          >
            {isSeller ? 'Selling' : 'Buying'}
          </Badge>
        </div>

        {/* Last message preview */}
        {conversation.last_message && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.last_message}
          </p>
        )}

        {/* Timestamp and price */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatRelativeTime(conversation.last_message_time)}</span>
          <span className="font-medium">
            ${(conversation.listing_price_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
