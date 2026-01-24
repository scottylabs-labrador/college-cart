import { auth } from '@clerk/nextjs/server';
import RequireLogin from '@/components/require_login';
import ChatPageClient from '../chat-page-client';
import MainHeader from '@/components/main-header';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ chat_id: string }>;
};

export default async function ChatConversationPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    return <RequireLogin />;
  }

  const { chat_id } = await params;

  // Fetch conversations from API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/chat/api/conversations`, {
    headers: {
      Cookie: '', // Server-side fetch, auth handled by Clerk
    },
    cache: 'no-store',
  });

  const data = await response.json();
  const conversations = data.success ? data.conversations : [];

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <ChatPageClient
        initialConversations={conversations}
        userId={userId}
        initialSelectedId={chat_id}
      />
    </div>
  );
}
