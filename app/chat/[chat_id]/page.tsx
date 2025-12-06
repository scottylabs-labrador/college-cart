'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import RequireLogin from '@/components/require_login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""; 

const supabase = createClient(
  'https://dkmaapjiqiqyxbjyshky.supabase.co',
 key
)
export const dynamic = 'force-dynamic';

export default function ChatPage(){
  const searchParams = useSearchParams();
  const chat_id = searchParams.get('chat');
  const { isLoaded, userId } = useAuth();  
  const { user } = useUser();  
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState('');


  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('message')
        .select('text')
        .eq('conversation_id', chat_id) 
        .order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        setMessages(data.map((msg) => msg.text));
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message' },
        (payload) => {
          console.log(payload);
          setMessages((prevMessages) => [
            ...prevMessages,
            payload.new.text
          ]);
          console.log(messages)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if(!userId){
    alert("You must be logged into use the chat!");
    return null;
  }

  if (!isLoaded || !userId) {
      return <RequireLogin />;
    }

  const handleSubmit = async(e: React.FormEvent) =>{
    e.preventDefault();
    if (!userId) {
      alert("You must be logged in to send a chat message.");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);
    formData.append("user_id", userId || "");
    formData.append("chat_id", chat_id || "");

    try {
      // Call the server action
      const response = await fetch("/chat/[chat_id]/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          user_id: userId,
          chat_id: chat_id,
        }),
      });

      const result = await response.json();
      console.log(result);
      setText("");
    }
    catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");
    }
  }


  return(
    <div className="min-h-screen bg-background">
      <div className="chat-messages space-y-2">
      {messages.map((msg, index) => (
        
        <div
          key={index}
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
        >
          <div>
            {user?.firstName}
          </div>
          {msg}
        </div>
      ))}
    </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="text"
            className="text-sm font-medium text-foreground"
          >
            Chat
          </label>
          <Input
            id="text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter message"
            className="w-full"
          />
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full border-0 text-white"
            style={{
              background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(to right, #3d2599, #9d7ff0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(to right, #4a2db8, #a78bfa)';
            }}
          >
            Send Chat
          </Button>
        </div>
      </form>
    </div>
  )



}
