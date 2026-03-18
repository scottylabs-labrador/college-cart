# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your CollegeCart Next.js application. This integration includes:

- **Client-side initialization** via `instrumentation-client.ts` for automatic pageviews, session replay, and error tracking
- **Server-side tracking** via `posthog-node` for reliable server-side event capture
- **User identification** integrated with Better Auth via `PostHogIdentify` component
- **Reverse proxy** configured in `next.config.ts` to bypass ad blockers and improve tracking reliability
- **20+ custom events** tracking the complete marketplace user journey from listing creation to sale completion

## Events Implemented

### Client-side Events

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `listing_viewed` | User views an item listing page (top of buyer funnel) | `app/item-page/[item_id]/item-page-client.tsx` |
| `category_browsed` | User browses a specific category page | `app/[category_id]/category-client.tsx` |
| `listing_clicked` | User clicks on a listing card from category page | `app/[category_id]/category-client.tsx` |
| `search_result_clicked` | User clicks on a listing from search/browse results | `app/view_listings/page.tsx` |
| `post_item_started` | User begins the item posting form (signals seller intent) | `app/post-item/page.tsx` |
| `image_uploaded` | User uploads images to a listing form | `app/post-item/page.tsx` |
| `listing_created` | Seller successfully creates a new listing for an item | `app/post-item/page.tsx` |
| `listing_creation_failed` | Listing creation fails due to validation or server error | `app/post-item/page.tsx` |
| `item_added_to_cart` | User adds an item to their favorites/cart | `app/item-page/[item_id]/item-page-client.tsx` |
| `item_removed_from_cart` | User removes an item from their favorites/cart | `app/item-page/[item_id]/item-page-client.tsx` |
| `offer_initiated` | Buyer initiates an offer on a listing | `app/item-page/[item_id]/item-page-client.tsx` |
| `chat_started` | User starts a new chat conversation with a seller | `app/item-page/[item_id]/item-page-client.tsx` |
| `listing_deleted` | Seller deletes their listing | `app/item-page/[item_id]/item-page-client.tsx` |
| `search_performed` | User performs a search for listings | `components/search-bar.tsx` |

### Server-side Events

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `conversation_created` | A new conversation is created between buyer and seller | `app/item-page/[item_id]/action/route.ts` |
| `favorite_toggled` | User toggles favorite/cart status on a listing | `app/item-page/[item_id]/f_action/route.ts` |
| `listing_deleted_server` | A listing is deleted from the database | `app/item-page/[item_id]/delete/route.ts` |
| `listing_created_server` | A new listing is successfully created in the database | `app/post-item/action/route.ts` |
| `sale_confirmed` | Buyer accepts a sale confirmation, marking the item as sold | `app/chat/[chat_id]/action/route.ts` |
| `sale_declined` | Buyer declines a sale confirmation | `app/chat/[chat_id]/action/route.ts` |
| `message_sent` | User sends a message in a chat conversation | `app/chat/[chat_id]/action/route.ts` |
| `confirmation_sent` | Seller sends a sale confirmation request to buyer | `app/chat/[chat_id]/action/route.ts` |

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `instrumentation-client.ts` | Created | Client-side PostHog initialization |
| `lib/posthog-server.ts` | Created | Server-side PostHog client |
| `components/posthog-identify.tsx` | Created | User identification with Better Auth |
| `next.config.ts` | Modified | Added reverse proxy rewrites |
| `app/layout.tsx` | Modified | Added PostHogIdentify component |
| `app/post-item/page.tsx` | Modified | Added post_item_started, image_uploaded, listing events |
| `app/item-page/[item_id]/item-page-client.tsx` | Modified | Added listing_viewed, cart, offer, chat, delete events |
| `app/[category_id]/category-client.tsx` | Modified | Added category_browsed, listing_clicked events |
| `app/view_listings/page.tsx` | Modified | Added search_result_clicked event |
| `app/item-page/[item_id]/action/route.ts` | Modified | Added conversation_created server-side event |
| `app/item-page/[item_id]/f_action/route.ts` | Modified | Added favorite_toggled server-side event |
| `app/item-page/[item_id]/delete/route.ts` | Modified | Added listing_deleted_server server-side event |
| `app/post-item/action/route.ts` | Modified | Added listing_created_server server-side event |
| `components/search-bar.tsx` | Modified | Added search event |
| `app/chat/[chat_id]/action/route.ts` | Modified | Added server-side sale and message events |
| `.env.local` | Modified | Added PostHog API key and host |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/314008/dashboard/1279840) - Core analytics dashboard for CollegeCart marketplace

### Insights
- [Buyer Engagement Trends](https://us.posthog.com/project/314008/insights/tcJ8OFKr) - Daily trends of listing views, cart adds, chats, and offers
- [Buyer Conversion Funnel](https://us.posthog.com/project/314008/insights/67mJuFqF) - View → Cart → Offer → Sale conversion funnel
- [Seller Funnel](https://us.posthog.com/project/314008/insights/42o9WtCQ) - Post item → Upload images → Create listing funnel
- [Search to Purchase](https://us.posthog.com/project/314008/insights/XDGcOkkd) - Search → Click → View → Offer journey
- [Category Performance](https://us.posthog.com/project/314008/insights/y9RpZWtO) - Listing views breakdown by category

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
