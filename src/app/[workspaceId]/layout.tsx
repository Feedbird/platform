'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const router = useRouter()
  const { setActiveWorkspace, workspaces, activeWorkspaceId } = useWorkspaceStore()

  useEffect(() => {
    // If the workspace ID in the URL doesn't match the active workspace, switch to it
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      const workspace = workspaces.find(w => w.id === workspaceId)
      if (workspace) {
        setActiveWorkspace(workspaceId)
      } else {
        // If workspace doesn't exist, redirect to home
        router.push('/')
      }
    }
  }, [workspaceId, activeWorkspaceId, workspaces, setActiveWorkspace, router])

  // Don't render children until workspace is active
  if (workspaceId !== activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
