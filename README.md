# CollegeCart

A centralized marketplace platform for the CMU community to buy and sell goods, services, and commissions. Built by [ScottyLabs Labrador](https://github.com/scottylabs-labrador).

## About

CollegeCart provides a dedicated platform for Carnegie Mellon University students to buy and sell textbooks, furniture, appliances, and more on campus with fellow Tartans. Using CollegeCart, students can purchase their favorite products, save and make money, while also reducing waste.

## Features

- **Secure Authentication** - Authentication powered by Clerk allowing only CMU students to access the platform via Andrew ID
- **Modern UI** - Clean, responsive interface built with Next.js and styled with Tailwind CSS
- **Full-Stack TypeScript** - End-to-end type safety across the entire application
- **Real-time Chat** - Leverages Supabase real-time broadcast for real-time chat between buyers and sellers
- **Campus-Focused** - Designed specifically for the CMU community

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Real-time)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Authentication**: [Clerk](https://clerk.com/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/scottylabs-labrador/college-cart.git
cd college-cart
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
   - Rename `.env.example` to `.env.local`
   - Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_SUPABASE_PUBLISHABLE_KEY]
```

You can find these values in your [Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true).

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
college-cart/
├── app/                 # Next.js app directory (routes, layouts)
├── components/          # React components
├── lib/                 # Utility functions and shared logic
├── public/              # Static assets
├── .env.example         # Environment variable template
└── middleware.ts        # Next.js middleware for auth
```

## Development

### Running Locally

The development server supports hot reloading and will automatically update as you make changes to your code.

## About ScottyLabs Labrador

College Cart is developed by the [ScottyLabs Labrador](https://github.com/scottylabs-labrador) committee, an incubator-style program focused on building innovative tools for the CMU community. [ScottyLabs](https://scottylabs.org) is Carnegie Mellon University's largest software development organization.

---

Built with ❤️ by ScottyLabs Labrador for the CMU community
