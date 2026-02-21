'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle } from 'lucide-react';
import ConfirmationDialog from '@/components/confirmation-dialog';

type ChatInputProps = {
  conversationId: string;
  userId: string;
  loading?: boolean;
  hideConfirmation?: boolean;
  onSend: (text: string) => Promise<void>;
  onSendConfirmation: (date: string, location: string, price: string) => Promise<void>;
};

export default function ChatInput({
  conversationId,
  userId,
  loading = false,
  hideConfirmation = false,
  onSend,
  onSendConfirmation,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 500) setText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            maxLength={500}
            disabled={loading || isSending}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden max-h-32"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          {text.length > 400 && (
            <span className={`absolute right-12 bottom-3 text-xs ${text.length >= 500 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {text.length}/500
            </span>
          )}
          <Button
            type="submit"
            disabled={loading || isSending || !text.trim()}
            size="icon"
            className="absolute right-1 bottom-1.5 h-8 w-8 border-0 text-white"
            style={{
              background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {!hideConfirmation && (
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
        )}
      </div>

      {!hideConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmationDialog}
          onClose={() => setShowConfirmationDialog(false)}
          onSend={handleConfirmation}
        />
      )}
    </>
  );
}
