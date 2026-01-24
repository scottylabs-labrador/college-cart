'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@/types/chat';

type ChatMessageListProps = {
  messages: Message[];
  userId: string;
  loading?: boolean;
  onConfirmationResponse?: (messageId: number, response: 'yes' | 'no') => void;
};

export default function ChatMessageList({
  messages,
  userId,
  loading = false,
  onConfirmationResponse
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <>
      {messages.map((msg) => {
        const isOwnMessage = msg.user === userId;

        // Check if message is a confirmation by trying to parse JSON
        let isConfirmation = false;
        try {
          const parsed = JSON.parse(msg.text);
          isConfirmation = parsed.type === 'confirmation';
        } catch {
          isConfirmation = msg.text?.includes('Confirmation Request:');
        }

        // Parse confirmation data from text if message_type is confirmation
        let confirmationData = msg.confirmation_data;
        if (isConfirmation && !confirmationData && msg.text) {
          const dateMatch = msg.text.match(/Date: (.+)/);
          const locationMatch = msg.text.match(/Location: (.+)/);
          const priceMatch = msg.text.match(/Price: (.+)/);
          if (dateMatch && locationMatch) {
            confirmationData = {
              date: dateMatch[1],
              location: locationMatch[1],
              price: priceMatch ? priceMatch[1] : '',
            };
          }
        }

        // Check if this message has been responded to
        const hasResponse = messages.some(m =>
          m.message_type === 'confirmation_response' &&
          m.confirmation_response_to === msg.message_id
        );
        const response = hasResponse
          ? messages.find(m =>
              m.message_type === 'confirmation_response' &&
              m.confirmation_response_to === msg.message_id
            )?.text?.includes('Yes') ? 'yes' : 'no'
          : null;

        // Render confirmation message
        if (isConfirmation && confirmationData) {
          return (
            <div
              key={msg.message_id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] rounded-lg bg-white border border-border overflow-hidden">
                <div className="p-3 space-y-2">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start">
                      <span className="font-medium min-w-[80px]">Date:</span>
                      <span className="flex-1">{confirmationData.date}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium min-w-[80px]">Location:</span>
                      <span className="flex-1">{confirmationData.location}</span>
                    </div>
                    {confirmationData.price && (
                      <div className="flex items-start">
                        <span className="font-medium min-w-[80px]">Price:</span>
                        <span className="flex-1">{confirmationData.price}</span>
                      </div>
                    )}
                  </div>
                </div>
                {response ? (
                  <div className="bg-muted px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Response: <span className="font-medium capitalize">{response}</span>
                    </span>
                  </div>
                ) : !isOwnMessage && onConfirmationResponse ? (
                  <div className="bg-muted px-3 py-2 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onConfirmationResponse(msg.message_id, 'no')}
                      className="flex-1 h-8 text-xs hover:bg-background"
                      disabled={loading}
                    >
                      no
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onConfirmationResponse(msg.message_id, 'yes')}
                      className="flex-1 h-8 text-xs hover:bg-background"
                      disabled={loading}
                    >
                      yes
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted px-3 py-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {isOwnMessage ? 'Waiting for response...' : 'Confirmation received'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Render regular text message
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
      })}
      <div ref={messagesEndRef} />
    </>
  );
}
