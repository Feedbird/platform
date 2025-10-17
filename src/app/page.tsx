'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'

export default function Home() {
  const router = useRouter()
  const { workspaces, activeWorkspaceId } = useFeedbirdStore()

  useEffect(() => {
    // If there's an active workspace, redirect to it
    if (activeWorkspaceId) {
      router.replace(`/${activeWorkspaceId}`)
      return
    }

    // If there are workspaces but none active, redirect to the first one
    if (workspaces.length > 0) {
      router.replace(`/${workspaces[0].id}`)
      return
    }

    // If no workspaces exist, go to workspace-invite page only on first load per tab
    try {
      const alreadyRedirected =
        typeof window !== 'undefined' && sessionStorage.getItem('ws-invite-redirected') === '1'
      if (workspaces.length === 0 && !alreadyRedirected) {
        sessionStorage.setItem('ws-invite-redirected', '1')
        router.replace(`/workspace-invite`)
        return
      }
    } catch {}
  }, [activeWorkspaceId, workspaces, router])

  // Show welcome/home content if no workspaces (after first-load redirect)
  if (workspaces.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold">Welcome to Feedbird</h1>
        <p className="mt-2 text-muted-foreground">
          Create your first workspace to get started.
        </p>
      </div>
    )
  }

  // Show loading while redirecting
  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting to workspace...</p>
        </div>
      </div>
    </div>
  )
}
  