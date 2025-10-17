import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { workspaceId, organizationId } = body as { workspaceId?: string; organizationId?: string }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    // Resolve the user's email and platform user UUID (actor)
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const primaryEmailId = (user as any).primaryEmailAddressId || (user as any).primary_email_address_id
    const emailObj = (user as any).emailAddresses?.find((e: any) => e.id === primaryEmailId) || (user as any).email_addresses?.find((e: any) => e.id === primaryEmailId)
    const email = emailObj?.emailAddress || emailObj?.email_address

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!userRow || !userRow.id) {
      return NextResponse.json({ error: 'User not found in application database' }, { status: 404 })
    }

    // Insert request access activity
    const { error: insertError } = await supabase
      .from('activities')
      .insert({
        workspace_id: workspaceId,
        post_id: null,
        type: 'workspace_access_requested',
        actor_id: userRow.id,
        metadata: {email, organizationId, workspaceId },
      })

    if (insertError) {
      console.error('Failed to insert request-access activity:', insertError)
      return NextResponse.json({ error: 'Failed to log request access' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Error in request-access:', e)
    return NextResponse.json({ error: e?.message || 'Failed to request access' }, { status: 500 })
  }
}


