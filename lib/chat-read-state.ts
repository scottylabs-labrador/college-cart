import type { Conversation } from '@/types/chat';

export const LAST_READ_KEY = 'chat_last_read';

export const CHAT_READ_EVENT = 'collegecart:chat-read';

export function getLastReadTimestamps(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LAST_READ_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markConversationRead(conversationId: string): void {
  if (typeof window === 'undefined') return;
  const timestamps = getLastReadTimestamps();
  timestamps[conversationId] = new Date().toISOString();
  localStorage.setItem(LAST_READ_KEY, JSON.stringify(timestamps));
  window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT));
}

export function isConversationUnread(
  conv: Pick<Conversation, 'conversation_id' | 'last_message_sender' | 'last_message_time'>,
  userId: string,
  lastReadTimestamps: Record<string, string>,
): boolean {
  const lastRead = lastReadTimestamps[conv.conversation_id];
  return (
    conv.last_message_sender !== null &&
    conv.last_message_sender !== userId &&
    conv.last_message_time !== null &&
    (!lastRead || new Date(conv.last_message_time) > new Date(lastRead))
  );
}

export function countUnreadConversations(
  conversations: Conversation[],
  userId: string,
): number {
  const ts = getLastReadTimestamps();
  return conversations.filter((c) => isConversationUnread(c, userId, ts)).length;
}
