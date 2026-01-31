import { auth } from '@clerk/nextjs/server';
import RequireLogin from '@/components/require_login';
import ChatPageClient from './chat-page-client';
import MainHeader from '@/components/main-header';
import { getConversations } from './lib/services/chat'; 

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const { userId } = await auth();

  if (!userId) {
    return <RequireLogin />;
  }

  const conversations = await getConversations(userId);

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <ChatPageClient
        initialConversations={conversations}
        userId={userId}
      />
    </div>
  );
}