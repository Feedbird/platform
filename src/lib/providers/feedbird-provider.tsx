'use client'

import { useEffect } from 'react'
import { generateDummyWorkspaces } from '@/lib/dummy/generate-dummy-workspaces'
import { useFeedbirdStore, usePostStatusTimeUpdater } from '@/lib/store/use-feedbird-store'

export default function FeedbirdProvider({ children }: { children: React.ReactNode }) {
  const workspaces = useFeedbirdStore(s => s.workspaces)

  // Initialize post status time updater
  usePostStatusTimeUpdater();

  useEffect(() => {
    if (workspaces.length === 0) {
      // self-invoking async fn so we can await inside useEffect
      ;(async () => {
        const dummy = await generateDummyWorkspaces(3)

        useFeedbirdStore.setState({
          workspaces: dummy,
          activeWorkspaceId: dummy[0].id,
          activeBrandId: dummy[0].brands[0]?.id ?? null,
        })
      })()
    }
  }, [workspaces.length])

  return <>{children}</>
}
