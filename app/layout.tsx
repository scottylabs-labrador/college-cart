import type { Metadata } from 'next'
import { Josefin_Sans } from 'next/font/google'
import './globals.css'
import PostHogIdentify from '@/components/posthog-identify'
import SiteFooter from '@/components/site-footer'

const josefin = Josefin_Sans({
  variable: '--font-josefin',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CollegeCart',
  description: "CMU's safe and simple marketplace",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={josefin.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <PostHogIdentify />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
