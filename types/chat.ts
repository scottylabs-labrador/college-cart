export type Message = {
  message_id: number;
  text: string;
  user: string;
  created_at: string;
  message_type?: string;
  confirmation_data?: {
    date: string;
    location: string;
    price?: string;
    response?: string;
  };
  confirmation_response_to?: number;
  confirmation_response?: string;
  system_event?: 'confirmation_accepted' | 'confirmation_declined' | 'item_sold';
};

export type Conversation = {
  conversation_id: string;
  listing_id: number;
  listing_title: string;
  listing_price_cents: number;
  buyer_id: string;
  seller_id: string;
  user_role: 'buyer' | 'seller';
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
};
