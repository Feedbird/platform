// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import FeedbirdProvider from "@/lib/providers/feedbird-provider"
import { LoadingProvider } from '@/lib/providers/loading-provider'
import PortalRoot from '@/components/portal-root/portal-root'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Toaster } from "@/components/ui/sonner"
import "nprogress/nprogress.css";
import { TopProgressBar } from "@/components/layout/top-progress-bar";
import { DynamicTitle } from "@/components/layout/dynamic-title";
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { AuthGuard } from '@/components/auth-guard'
import { ClerkUserSync } from '@/components/clerk-user-sync'

export const metadata: Metadata = {
  icons: {
    icon: '/images/logo/logo.svg',
  },
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} h-screen overflow-hidden tracking-[-0.26px]`}>
          <ClerkUserSync />
          <AuthGuard>
            <LoadingProvider>
              <SidebarProvider>
                <FeedbirdProvider>
                  <Suspense fallback={null}>
                    <TopProgressBar />
                  </Suspense>
                  <DynamicTitle />
                  <AppSidebar />
                  <SidebarInset>
                    <AppHeader />
                    <Suspense fallback={null}>
                      <main className="flex w-full h-[calc(100vh-48px)] bg-background">{children}</main>
                    </Suspense>
                  </SidebarInset>
                </FeedbirdProvider>
              </SidebarProvider>
            </LoadingProvider>
            <PortalRoot/>
            <LoadingSpinner />
            <Toaster 
              position="bottom-right"
              expand={true}
              richColors
              closeButton
            />
          </AuthGuard>
        </body>
      </html>
    </ClerkProvider>
  )
}
