import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/lib/auth-server';
import { getConversations } from '@/app/chat/lib/services/chat';

export async function GET(request: Request) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const nonEmptyConversations = await getConversations(userId);

    return NextResponse.json({
      success: true,
      conversations: nonEmptyConversations,
    });
  } catch (error) {
    console.error('Unexpected error in GET /chat/api/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
