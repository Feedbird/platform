// lib/store/workspaceStore.ts
import { create } from 'zustand'
import { faker } from '@faker-js/faker'

export type Workspace = {
  id: string
  name: string
  plan: string
  logo: React.ComponentType<any> // storing a React icon, like the reference code
  clerk_organization_id?: string
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  setActive: (id: string) => void
  addWorkspace: (name: string) => void
  deleteWorkspace: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
  // For example, we create 2 sample "teams"
  const initial: Workspace[] = [
    {
      id: faker.string.uuid(),
      name: 'A Marketing Team',
      plan: 'A Information',
      logo: () => <svg width="20" height="20"><circle cx="10" cy="10" r="10" fill="blue" /></svg>,
    },
    {
      id: faker.string.uuid(),
      name: 'B Marekting Team',
      plan: 'B Information',
      logo: () => <svg width="20" height="20"><circle cx="10" cy="10" r="10" fill="red" /></svg>,
    },
  ]

  return {
    workspaces: initial,
    activeWorkspace: initial[0],
    setActive: (id) => set((state) => ({
      activeWorkspace: state.workspaces.find((w) => w.id === id) || null,
    })),
    addWorkspace: (name: string) =>
      set((state) => ({
        workspaces: [
          ...state.workspaces,
          {
            id: faker.string.uuid(),
            name,
            plan: 'Test',
            logo: () => <svg width="20" height="20"><circle cx="10" cy="10" r="10" fill="green" /></svg>,
          },
        ],
      })),
    deleteWorkspace: (id: string) =>
      set((state) => {
        const updated = state.workspaces.filter((w) => w.id !== id)
        return {
          workspaces: updated,
          activeWorkspace: state.activeWorkspace?.id === id ? updated[0] || null : state.activeWorkspace,
        }
      }),
  }
})
