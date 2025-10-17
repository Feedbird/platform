import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await req.json()
    const { organizationId, invitationId, workspaceId } = body
    
    if (!organizationId || !invitationId || !workspaceId) {
      return NextResponse.json({ error: 'organizationId, invitationId and workspaceId are required' }, { status: 400 })
    }
    
    const clerk = await clerkClient()
    
    // First, revoke the invitation in Clerk organization
    let clerkRevocationSuccess = false
    try {
      await clerk.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId,
      })
      console.log(`Successfully revoked Clerk invitation ${invitationId} for organization ${organizationId}`)
      clerkRevocationSuccess = true
    } catch (clerkError: any) {
      console.error('Failed to revoke Clerk invitation:', clerkError)
      return NextResponse.json({ error: 'Failed to revoke invitation in Clerk organization' }, { status: 500 })
    }
    
    // Only proceed with database cleanup if Clerk revocation succeeded
    if (!clerkRevocationSuccess) {
      return NextResponse.json({ error: 'Clerk revocation failed' }, { status: 500 })
    }
    
    // Get user's email for the membership cleanup
    const user = await clerk.users.getUser(userId)
    const primaryEmailId = (user as any).primaryEmailAddressId || (user as any).primary_email_address_id
    const emailObj = (user as any).emailAddresses?.find((e: any) => e.id === primaryEmailId) || (user as any).email_addresses?.find((e: any) => e.id === primaryEmailId)
    const email = emailObj?.emailAddress || emailObj?.email_address
    
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }
    console.log("email:", email);
    
    // Then, remove the membership from our database
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('email', email)
      .eq('is_workspace', true)
      .eq('accept', false)
      .eq('workspace_id', workspaceId)    
    if (deleteError) {
      console.error('Error deleting membership:', deleteError)
      return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 })
    }
    
    console.log(`Successfully removed membership for email ${email}`)
    // Log activity: workspace_invited_declined
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      if (userRow && userRow.id && workspaceId) {
        await supabase
          .from('activities')
          .insert({
            workspace_id: workspaceId,
            post_id: null,
            type: 'workspace_invited_declined',
            actor_id: userRow.id,
            metadata: { email, organizationId, workspaceId },
          })
      }
    } catch (logErr) {
      console.warn('Failed to log decline activity:', logErr)
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Error in decline invitation:', e)
    return NextResponse.json({ error: e?.message || 'Failed to decline invitation' }, { status: 500 })
  }
}



