import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json([], { status: 200 })

    // Resolve the user's primary email to query membership invites
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const primaryEmailId = (user as any).primaryEmailAddressId || (user as any).primary_email_address_id
    const emailObj = (user as any).emailAddresses?.find((e: any) => e.id === primaryEmailId) || (user as any).email_addresses?.find((e: any) => e.id === primaryEmailId)
    const email = emailObj?.emailAddress || emailObj?.email_address

    if (!email) return NextResponse.json([], { status: 200 })

    // One query: workspaces joined with pending membership rows for this user
    const { data: workspaceRows, error: wsJoinErr } = await supabase
      .from('workspaces')
      .select('id, name, logo, clerk_organization_id, members!inner(id, email, is_workspace, accept)')
      .eq('members.email', email)
      .eq('members.is_workspace', true)
      .eq('members.accept', false)

    if (wsJoinErr) {
      console.error('Error fetching workspaces with pending invites:', wsJoinErr)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    const rows = (workspaceRows as any[]) || []

    // Fetch Clerk invitation details per organization to get status and expiration
    const orgIds = Array.from(new Set(rows.map(r => r.clerk_organization_id).filter(Boolean))) as string[]

    const invitationsByOrg: Record<string, any[]> = {}
    await Promise.all(orgIds.map(async (orgId) => {
      try {
        const list = await clerk.organizations.getOrganizationInvitationList({ organizationId: orgId })
        invitationsByOrg[orgId] = (list as any)?.data || []
      } catch (err) {
        console.warn('Failed to load invitations for org', orgId, err)
        invitationsByOrg[orgId] = []
      }
    }))

    const result = rows.map((wsRow: any) => {
      const orgId = wsRow.clerk_organization_id as string | null

      // Find matching Clerk invitation (if org present)
      let invForUser: any | undefined
      if (orgId) {
        const invites = invitationsByOrg[orgId] || []
        // Prefer pending invite for this email, else most recent invite for this email
        invForUser = invites.find((i: any) => i.emailAddress === email)
      }

      return {
        id: invForUser?.id,
        email_address: email,
        organization_id: orgId || undefined,
        organization_name: wsRow.name || undefined,
        workspace_id: wsRow.id || undefined,
        workspace_logo: wsRow.logo || undefined,
        status: invForUser?.status || 'pending',
        url: invForUser?.url,
        expires_at: invForUser?.expiresAt ?? null,
      }
    })

    return NextResponse.json(result)
  } catch (e: any) {
    console.error("Error loading invitations", e);
    return NextResponse.json({ error: e?.message || 'Failed to load invitations' }, { status: 500 })
  }
}


