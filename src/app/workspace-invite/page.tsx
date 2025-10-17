'use client'

import Image from 'next/image'
import Link from 'next/link'
import { auth, clerkClient } from '@clerk/nextjs/server'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useFeedbirdStore } from '@/lib/store/use-feedbird-store'
import { workspaceHelperApi, invitationsApi, storeApi } from '@/lib/api/api-service'
import { LockKeyholeOpen } from 'lucide-react'

type InvitationDTO = {
    id: string
    status: 'pending' | 'expired' | string
    organization_id?: string
    organization_name?: string
    expires_at?: string | null
    workspace_id?: string
    workspace_logo?: string
    workspace_name?: string
    email_address?: string
    url?: string
}

function Header() {
    return (
        <header className="absolute w-full h-22 flex items-center justify-between pl-10 pr-12">
            <Link href="/" className="flex items-center gap-2">
                <Image src="/images/logo/logo(1).svg" alt="FeedBird" width={127} height={20} className="h-5 w-auto" />
            </Link>
            <div className="flex items-center gap-8 text-sm text-drakGrey font-normal">
                <a href="/help" target="_blank" rel="noreferrer">Help</a>
                <a href="mailto:support@feedbird.ai">Contact</a>
            </div>
        </header>
    )
}
// async function fetchInvitations(): Promise<InvitationDTO[]> {
//   const { userId } = await auth()
//   if (!userId) return []
//   const clerk = await clerkClient()
//   const user = await clerk.users.getUser(userId)
//   const primaryEmailId = (user as any).primaryEmailAddressId || (user as any).primary_email_address_id
//   const emailObj = (user as any).emailAddresses?.find((e: any) => e.id === primaryEmailId) || (user as any).email_addresses?.find((e: any) => e.id === primaryEmailId)
//   const email = emailObj?.emailAddress || emailObj?.email_address
//   if (!email) return []

//   const secret = process.env.CLERK_SECRET_KEY
//   if (!secret) return []
//   try {
//     const res = await fetch(`https://api.clerk.com/v1/invitations?email_address=${encodeURIComponent(email)}`, {
//       headers: { Authorization: `Bearer ${secret}` },
//       cache: 'no-store',
//     })
//     if (!res.ok) return []
//     const data = await res.json()
//     const invitations: InvitationDTO[] = Array.isArray(data)
//       ? data.map((inv: any) => ({
//           id: inv.id,
//           status: inv.status,
//           organization_id: inv.organization_id,
//           expires_at: inv.expires_at,
//         }))
//       : []

//     const uniqueOrgIds = Array.from(new Set(invitations.map(i => i.organization_id).filter(Boolean))) as string[]
//     const orgMap = new Map<string, string>()
//     await Promise.all(uniqueOrgIds.map(async (orgId) => {
//       try {
//         const org = await clerk.organizations.getOrganization({ organizationId: orgId })
//         orgMap.set(orgId, (org as any).name)
//       } catch {}
//     }))
//     return invitations.map(i => ({ ...i, organization_name: i.organization_id ? orgMap.get(i.organization_id) : undefined }))
//   } catch {
//     return []
//   }
// }

export default function WorkspaceInvitePage() {
    return (
        <div className="min-h-screen w-full bg-background">
            <Header />
            <ClientSectionInline />
        </div>
    )
}
function ClientSectionInline() {
    const router = useRouter()
    const workspaces = useFeedbirdStore((s) => s.workspaces)
    const user = useFeedbirdStore((s) => s.user)
    const [membersCountByWs, setMembersCountByWs] = React.useState<Record<string, number>>({})
    const [invites, setInvites] = React.useState<InvitationDTO[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<Record<string, string | null>>({})

    React.useEffect(() => {
        const loadInvites = async () => {
            try {
                const data = await invitationsApi.getInvitations()
                setInvites(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Failed to load invitations:', error)
                setInvites([])
            } finally {
                setLoading(false)
            }
        }
        loadInvites()
    }, [])

    const pendingInvites = invites.filter((i) => i.status === 'pending')
    const expiredInvites = invites.filter((i) => i.status === 'expired')

    React.useEffect(() => {
        let mounted = true
        const loadCounts = async () => {
            const entries: Record<string, number> = {}
            for (const ws of workspaces) {
                try {
                    const res = await workspaceHelperApi.getWorkspaceMembers(ws.id)
                    entries[ws.id] = (res.users || []).length
                } catch { }
            }
            if (mounted) setMembersCountByWs(entries)
        }
        loadCounts()
        return () => {
            mounted = false
        }
    }, [workspaces])

    const handleAccept = async (id: string) => {
        setActionLoading(prev => ({ ...prev, [id]: 'accept' }))
        try {
            // Find the invitation to get organization_id
            const invitation = invites.find(inv => inv.id === id)
            if (!invitation?.organization_id) {
                console.error('Organization ID not found for invitation')
                return
            }
            if(!invitation.workspace_id) {
                console.error('Workspace ID not found for invitation')
                return
            }
            await invitationsApi.acceptInvitation(id, invitation.organization_id, invitation.workspace_id)
            
            // Reload user workspaces to include the newly accepted workspace
            const userEmail = user?.email
            if (userEmail) {
                await storeApi.loadUserWorkspaces(userEmail)
            }
            
            router.push(`/${invitation.workspace_id}`)
        } catch (error) {
            console.error('Failed to accept invitation:', error)
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }))
        }
    }
    const handleDecline = async (id: string) => {
        setActionLoading(prev => ({ ...prev, [id]: 'decline' }))
        try {
            // Find the invitation to get organization_id
            const invitation = invites.find(inv => inv.id === id)
            if (!invitation?.organization_id) {
                console.error('Organization ID not found for invitation')
                return
            }
            if(!invitation.workspace_id) {
                console.error('Workspace ID not found for invitation')
                return
            }
            await invitationsApi.declineInvitation(id, invitation.organization_id, invitation.workspace_id)
            // Remove the declined invitation from local state
            setInvites(prev => prev.filter(inv => inv.id !== id))
        } catch (error) {
            console.error('Failed to decline invitation:', error)
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }))
        }
    }
    const handleRequestAccess = async (id: string, orgId?: string) => {
        setActionLoading(prev => ({ ...prev, [id]: 'request' }))
        try {
            const inv = invites.find(i => i.id === id)
            if (inv?.workspace_id) {
                try {
                    await invitationsApi.requestAccess(inv.workspace_id, orgId)
                } catch (e) {
                    console.warn('Failed to log request access activity', e)
                }
            }
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }))
        }
    }

    const formatExpires = (iso?: string | null) => {
        if (!iso) return ''
        const now = Date.now()
        const expires = new Date(iso).getTime()
        const diffMs = expires - now
        if (isNaN(expires)) return ''
        if (diffMs <= 0) return 'Expired'
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)
        if (days >= 1) return `Expires in ${days} day${days === 1 ? '' : 's'}`
        return `Expires in ${hours} hour${hours === 1 ? '' : 's'}`
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#FAFAFA]">
            <div className="w-[520px] max-w-[90vw] mx-auto p-8 rounded-[12px] border border-elementStroke bg-white">
                <div className="text-start mb-8">
                    <h1 className="text-xl font-medium text-black">Manage your workspaces invitations</h1>
                    <p className="mt-2 text-base font-normal text-darkGrey">
                        Review and accept your workspace invitations bellow. Once you join a workspace, you'll be able to access all its tools and content.
                    </p>
                </div>

                    {workspaces.length === 0 && pendingInvites.length === 0 && expiredInvites.length === 0 ? (
                        <div className="space-y-3">
                            <div className="text-base text-grey font-normal">You have no workspace yet.</div>
                            <Button variant="primary" className="!h-10 w-full py-2.5 text-sm" onClick={() => router.push('/')}>Go back to Home</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className='text-sm font-normal text-darkGrey'>Workspace</p>
                            {pendingInvites.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between border border-main rounded-[6px] px-4 py-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {inv.workspace_logo ? (
                                            <div className='size-6 rounded flex items-center justify-center overflow-hidden rounded'>
                                                <img src={inv.workspace_logo} alt={inv.organization_name || 'Workspace'} className='w-full h-full object-cover object-center rounded'/>
                                            </div>
                                        ) : (
                                            <div className="size-6 rounded bg-main flex items-center justify-center">
                                                <span className="text-xs font-semibold uppercase text-white">{(inv.organization_name || 'WS').slice(0, 1)}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-black truncate leading-[16px]">{inv.organization_name || 'Workspace'}</div>
                                            <div className="text-xs text-[#EC5050] font-normal mt-1.5">{formatExpires(inv.expires_at)}</div>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                         <Button 
                                             variant="tertiary" 
                                             className="text-main border-main" 
                                             onClick={() => handleDecline(inv.id)}
                                             disabled={actionLoading[inv.id] === 'accept' || actionLoading[inv.id] === 'decline'}
                                         >
                                             {actionLoading[inv.id] === 'decline' ? 'Declining...' : 'Decline'}
                                         </Button>
                                         <Button 
                                             variant="primary" 
                                             onClick={() => handleAccept(inv.id)}
                                             disabled={actionLoading[inv.id] === 'accept' || actionLoading[inv.id] === 'decline'}
                                         >
                                             {actionLoading[inv.id] === 'accept' ? 'Accepting...' : 'Accept'}
                                         </Button>
                                     </div>
                                </div>
                            ))}
                            {workspaces.map((ws) => (
                                <div key={ws.id} className="flex items-center justify-between border border-elementStroke rounded-[6px] px-4 py-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {ws.logo ? (
                                            <div className='size-6 rounded flex items-center justify-center overflow-hidden rounded'>
                                                <img src={ws.logo} alt={ws.name || 'Workspace'} className='w-full h-full object-cover object-center rounded'/>
                                            </div>
                                        ) : (
                                            <div className="size-6 rounded bg-[#B5B5FF] flex items-center justify-center">
                                                <span className="text-xs font-semibold uppercase text-[#5C5E63]">{(ws.name || 'WS').slice(0, 1)}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-black truncate leading-[16px]">{ws.name || 'Workspace'}</div>
                                            <div className="text-xs text-darkGrey font-normal mt-1.5">{typeof membersCountByWs[ws.id] === 'number' ? `${membersCountByWs[ws.id]} members` : '— members'}</div>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                         <Button 
                                             variant="tertiary" 
                                             onClick={() => router.push(`/${ws.id}`)}
                                             disabled={Object.values(actionLoading).some(loading => loading !== null)}
                                         >
                                             Open workspace
                                         </Button>
                                     </div>
                                </div>
                            ))}
                            {expiredInvites.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between border border-elementStroke rounded-[6px] px-4 py-3 bg-white opacity-80">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {inv.workspace_logo ? (
                                            <div className='size-6 rounded flex items-center justify-center overflow-hidden rounded'>
                                                <img src={inv.workspace_logo} alt={inv.organization_name || 'Workspace'} className='w-full h-full object-cover object-center rounded'/>
                                            </div>
                                        ) : (
                                            <div className="size-6 rounded bg-[#B5B5FF] flex items-center justify-center">
                                                <span className="text-xs font-semibold uppercase text-[#5C5E63]">{(inv.organization_name || 'WS').slice(0, 1)}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-black truncate leading-[16px]">{inv.organization_name || 'Workspace'}</div>
                                            <div className="text-xs text-darkGrey font-normal mt-1.5">Invitation expired</div>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                         <Button 
                                             variant="tertiary" 
                                             className="text-main gap-2" 
                                             onClick={() => handleRequestAccess(inv.id, inv.organization_id)}
                                             disabled={actionLoading[inv.id] === 'request'}
                                         >
                                             <LockKeyholeOpen className="size-3.5" />
                                             <span>{actionLoading[inv.id] === 'request' ? 'Requesting...' : 'Request Access'}</span>
                                         </Button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}

                <div className="text-start text-sm text-darkGrey font-normal mt-8">
                    Need help?{' '}
                    <button className="underline cursor-pointer" onClick={() => window.open('/help/invites', '_blank')}>Read how invites work</button>{' '}or{' '}
                    <button className="underline cursor-pointer" onClick={() => window.open('mailto:support@feedbird.ai', '_self')}>contact support</button>.
                </div>
            </div>
        </div>
    )
}


