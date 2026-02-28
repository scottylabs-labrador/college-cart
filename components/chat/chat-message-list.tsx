'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@/types/chat';
import { CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import gcalIcon from '@/app/assets/gcal.png';

type ChatMessageListProps = {
  messages: Message[];
  userId: string;
  loading?: boolean;
  listingTitle?: string;
  onConfirmationResponse?: (messageId: number, response: 'yes' | 'no') => void;
};

export default function ChatMessageList({
  messages,
  userId,
  loading = false,
  listingTitle = '',
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

        // ── System event: confirmation accepted ──
        if (msg.system_event === 'confirmation_accepted') {
          const calData = msg.confirmation_data;
          let calendarUrl = '';
          if (calData) {
            const atIdx = calData.date.indexOf(' at ');
            const datePart = atIdx !== -1 ? calData.date.substring(0, atIdx) : calData.date;
            const timePart = atIdx !== -1 ? calData.date.substring(atIdx + 4) : null;
            let startDate = new Date(datePart);
            if (isNaN(startDate.getTime())) startDate = new Date();
            if (timePart) {
              const match = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              if (match) {
                let h = parseInt(match[1]);
                const m = parseInt(match[2]);
                const ap = match[3].toUpperCase();
                if (ap === 'PM' && h !== 12) h += 12;
                if (ap === 'AM' && h === 12) h = 0;
                startDate.setHours(h, m, 0, 0);
              }
            }
            const pad = (n: number) => n.toString().padStart(2, '0');
            const toCalStr = (dt: Date) =>
              `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
            calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE`
              + `&text=${encodeURIComponent(`CollegeCart ${listingTitle} Meeting`)}`
              + `&dates=${toCalStr(startDate)}/${toCalStr(endDate)}`
              + `&location=${encodeURIComponent(calData.location || '')}`
              + `&ctz=America/New_York`;
          }
          return (
            <div key={msg.message_id} className="flex justify-center my-4">
              <div className="w-full max-w-sm rounded-lg border border-green-200 bg-green-50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-b border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-green-800">Sale Confirmed</span>
                </div>
                {calData && (
                  <div className="px-4 py-3 space-y-1 text-sm text-green-900">
                    <div className="flex">
                      <span className="font-medium min-w-[80px]">Date:</span>
                      <span>{calData.date}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium min-w-[80px]">Location:</span>
                      <span>{calData.location}</span>
                    </div>
                    {calData.price && (
                      <div className="flex">
                        <span className="font-medium min-w-[80px]">Price:</span>
                        <span>{calData.price}</span>
                      </div>
                    )}
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-1 text-green-700 underline hover:text-green-900"
                    >
                      <Image src={gcalIcon} alt="Google Calendar" width={18} height={18} className="inline-block" />
                      Add Event to Google Calendar
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // ── System event: confirmation declined ──
        if (msg.system_event === 'confirmation_declined') {
          return (
            <div key={msg.message_id} className="flex justify-center my-3">
              <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-xs font-medium text-red-700">Confirmation declined</span>
              </div>
            </div>
          );
        }

        // ── System event: item sold (other conversation) ──
        if (msg.system_event === 'item_sold') {
          return (
            <div key={msg.message_id} className="flex justify-center my-4">
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3">
                <ShoppingBag className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-800">This item has already been sold</span>
              </div>
            </div>
          );
        }

        // ── Confirmation request card ──
        let isConfirmation = false;
        try {
          const parsed = JSON.parse(msg.text);
          isConfirmation = parsed.type === 'confirmation';
        } catch {
          isConfirmation = msg.text?.includes('Confirmation Request:');
        }

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

        // Check if this confirmation has been accepted or declined
        const acceptedMsg = messages.find(m =>
          m.system_event === 'confirmation_accepted' &&
          m.confirmation_response_to === msg.message_id
        );
        const declinedMsg = messages.find(m =>
          m.system_event === 'confirmation_declined' &&
          m.confirmation_response_to === msg.message_id
        );
        const responseStatus: 'accepted' | 'declined' | null =
          acceptedMsg ? 'accepted' : declinedMsg ? 'declined' : null;

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
                {responseStatus === 'accepted' ? (
                  <div className="bg-green-50 px-3 py-2 border-t border-green-200">
                    <span className="text-xs font-medium text-green-700">Accepted</span>
                  </div>
                ) : responseStatus === 'declined' ? (
                  <div className="bg-red-50 px-3 py-2 border-t border-red-200">
                    <span className="text-xs font-medium text-red-700">Declined</span>
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

        // ── Regular text message ──
        return (
          <div
            key={msg.message_id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] min-w-0 rounded-lg px-3 py-1.5 overflow-hidden ${
                isOwnMessage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>
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
