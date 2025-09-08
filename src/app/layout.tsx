// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import "nprogress/nprogress.css";
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AuthGuard } from '@/components/auth-guard'
import { ClerkUserSync } from '@/components/clerk-user-sync'

export const metadata: Metadata = {
  title: 'FeedBird Platform',
  description: 'Social media management platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/images/logo/logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/images/logo/logo.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      }
    ],
    shortcut: '/images/logo/logo.svg',
    apple: '/images/logo/logo.svg',
  },
  other: {
    'msapplication-TileColor': '#135aff',
    'theme-color': '#135aff',
  },
}

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" type="image/svg+xml" href="/images/logo/logo.svg" />
          <link rel="alternate icon" href="//images/logo/logo.svg" />
          <link rel="apple-touch-icon" href="/images/logo/logo.svg" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className={`${inter.variable} h-screen overflow-hidden tracking-[-0.26px]`}>
          <ClerkUserSync />
          <AuthGuard>
            {children}
          </AuthGuard>
        </body>
      </html>
    </ClerkProvider>
  )
}
