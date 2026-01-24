'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle } from 'lucide-react';
import ConfirmationDialog from '@/components/confirmation-dialog';

type ChatInputProps = {
  conversationId: string;
  userId: string;
  loading?: boolean;
  onSend: (text: string) => Promise<void>;
  onSendConfirmation: (date: string, location: string, price: string) => Promise<void>;
};

export default function ChatInput({
  conversationId,
  userId,
  loading = false,
  onSend,
  onSendConfirmation,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !conversationId || !text.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmation = async (date: string, location: string, price: string) => {
    setIsSending(true);
    try {
      await onSendConfirmation(date, location, price);
      setShowConfirmationDialog(false);
    } catch (error) {
      console.error('Failed to send confirmation:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="pr-12"
            disabled={loading || isSending}
          />
          <Button
            type="submit"
            disabled={loading || isSending || !text.trim()}
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 border-0 text-white"
            style={{
              background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowConfirmationDialog(true)}
          className="w-full text-xs"
          disabled={loading || isSending}
        >
          <CheckCircle className="h-3 w-3 mr-2" />
          Send Confirmation
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        onSend={handleConfirmation}
      />
    </>
  );
}
