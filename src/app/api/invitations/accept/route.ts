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
    let clerkAcceptionSuccess = false
    // Accept the organization invitation
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId,
        userId,
        role: 'org:admin',
      })

      await clerk.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId,
      })
      
      console.log(`Successfully accepted invitation and joined organization ${organizationId}`)
      clerkAcceptionSuccess = true;
    } catch (clerkError: any) {
      console.error('Failed to accept Clerk invitation:', clerkError)
      return NextResponse.json({ error: 'Failed to accept invitation in Clerk organization' }, { status: 500 })
    }

    // Only proceed with database cleanup if Clerk revocation succeeded
    if (!clerkAcceptionSuccess) {
      return NextResponse.json({ error: 'Clerk acceptance failed' }, { status: 500 })
    }
    
    // Get user's email for the membership update
    const user = await clerk.users.getUser(userId)
    const primaryEmailId = (user as any).primaryEmailAddressId || (user as any).primary_email_address_id
    const emailObj = (user as any).emailAddresses?.find((e: any) => e.id === primaryEmailId) || (user as any).email_addresses?.find((e: any) => e.id === primaryEmailId)
    const email = emailObj?.emailAddress || emailObj?.email_address
    
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }
    
    // Update the membership to accepted
    const { error: updateError } = await supabase
      .from('members')
      .update({ accept: true })
      .eq('email', email)
      .eq('is_workspace', true)
      .eq('accept', false)
      .eq('workspace_id', workspaceId)
    
    if (updateError) {
      console.error('Error updating membership:', updateError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }
    
    console.log(`Successfully accepted membership for email ${email}`)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Error in accept invitation:', e)
    return NextResponse.json({ error: e?.message || 'Failed to accept invitation' }, { status: 500 })
  }
}



