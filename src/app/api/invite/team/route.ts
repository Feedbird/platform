import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { clerkClient } from '@clerk/nextjs/server'

const InviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  workspaceId: z.string().uuid(),
  actorId: z.string().optional(),
  organizationId: z.string().optional(),
  first_name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, workspaceId, actorId, first_name } = InviteSchema.parse(body)

    // Force member (team) role
    const memberRole: 'team' = 'team'
    const requestedRole: string = 'org:member'

    // 1) Clerk org invite
    let clerkInvitationSent = false
    try {
      const clerk = await clerkClient()
      let redirectUrl = process.env.CLERK_INVITE_REDIRECT_URL
      const hasValidRedirect = !!(redirectUrl && /^https?:\/\//i.test(redirectUrl))

      let organizationId = (body.organizationId as string | undefined) || ''
      const targetWorkspaceId: string | undefined = workspaceId

      if (!organizationId && targetWorkspaceId) {
        const { data: wsRow } = await supabase
          .from('workspaces')
          .select('clerk_organization_id')
          .eq('id', targetWorkspaceId)
          .single()
        if (wsRow?.clerk_organization_id) organizationId = wsRow.clerk_organization_id as string
      }

      if (!organizationId) {
        return NextResponse.json({ error: 'organizationId is required. Provide a valid Clerk organizationId.' }, { status: 400 })
      }
      if (!/^org_/.test(organizationId)) {
        return NextResponse.json({ error: 'Invalid organizationId provided' }, { status: 400 })
      }

      const inviterName = (first_name && first_name.trim()) ? first_name.trim() : 'A Feedbird user'

      try {
        const params: any = {
          organizationId,
          emailAddress: email,
          role: requestedRole,
          redirectUrl: (() => {
            if (!hasValidRedirect) return undefined
            try {
              const url = new URL(redirectUrl as string)
              if (targetWorkspaceId) url.searchParams.set('workspaceId', targetWorkspaceId)
              url.searchParams.set('role', memberRole)
              return url.toString()
            } catch {
              return redirectUrl
            }
          })(),
          publicMetadata: { inviter_name: inviterName },
        }
        await clerk.organizations.createOrganizationInvitation(params)
        clerkInvitationSent = true
      } catch (inviteErr: any) {
        const clerkErrors = inviteErr?.errors as Array<{ code?: string; message?: string }> | undefined
        const hasRedirectIssue = Array.isArray(clerkErrors) && clerkErrors.some(e => (e.code || '').toLowerCase().includes('redirect') || (e.message || '').toLowerCase().includes('redirect'))
        if (hasRedirectIssue && hasValidRedirect) {
          const retryParams: any = { organizationId, emailAddress: email, role: requestedRole, publicMetadata: { inviter_name: inviterName } }
          await clerk.organizations.createOrganizationInvitation(retryParams)
          clerkInvitationSent = true
        } else if (inviteErr?.status === 409 || (inviteErr?.message || '').toLowerCase().includes('already')) {
          clerkInvitationSent = true
        } else if (inviteErr?.status === 403) {
          return NextResponse.json({ error: 'Forbidden creating organization invitation', clerk: clerkErrors || [{ message: inviteErr?.message }] }, { status: 403 })
        } else {
          return NextResponse.json({ error: 'Failed to create organization invitation', details: (Array.isArray(clerkErrors) && clerkErrors[0]?.message) || inviteErr?.message || 'Unknown error' }, { status: 500 })
        }
      }
    } catch {}

    // 2) Prepare members rows
    type MemberInsert = {
      email: string
      workspace_id: string
      board_id: string | null
      is_workspace: boolean
      role: 'client' | 'team'
      accept: boolean
    }
    const rows: MemberInsert[] = [
      { email, workspace_id: workspaceId, board_id: null, is_workspace: true, role: memberRole, accept: false }
    ]
    if (rows.length === 0) return NextResponse.json({ error: 'Nothing to invite' }, { status: 400 })

    // 3) Filter existing
    const existingRecords = await Promise.all(
      rows.map(async (row) => {
        let query = supabase
          .from('members')
          .select('id')
          .eq('email', row.email)
          .eq('workspace_id', row.workspace_id)
        if (row.board_id === null) query = query.is('board_id', null)
        else query = query.eq('board_id', row.board_id)
        const { data, error } = await query.single()
        if (error && error.code !== 'PGRST116') return null
        return data ? null : row
      })
    )
    const newRows = existingRecords.filter((row): row is MemberInsert => row !== null)
    if (newRows.length === 0) {
      return NextResponse.json({ message: 'No changes', details: 'The user was already invited to all selected workspaces/boards. Organization invite may not have been sent.', warning: !clerkInvitationSent })
    }

    // 4) Insert
    const { error: insertErr } = await supabase.from('members').insert(newRows)
    if (insertErr) return NextResponse.json({ error: 'Failed to save members' }, { status: 500 })

    // 5) Activities
    try {
      if (actorId) {
        const activityPromises: any[] = []
        newRows.forEach(row => {
          if (row.is_workspace) {
            activityPromises.push(
              supabase.from('activities').insert({ workspace_id: row.workspace_id, post_id: null, type: 'workspace_invited_sent', actor_id: actorId, metadata: { invitedEmail: email, workspaceId: row.workspace_id } })
            )
          }
        })
        await Promise.all(activityPromises)
      }
    } catch {}

    if (clerkInvitationSent) return NextResponse.json({ message: 'Organization invitation sent successfully', details: `Invited to ${newRows.length} workspace(s)/board(s)` })
    return NextResponse.json({ message: 'Organization invitation processed', details: `Database processed ${newRows.length} workspace(s)/board(s). Organization invite may have failed.`, warning: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues.map(i => i.message).join(', ') }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


