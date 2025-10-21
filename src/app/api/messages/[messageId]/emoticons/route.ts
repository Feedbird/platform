import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = params
    const body = await request.json()
    const { emoticons } = body

    if (!emoticons || !Array.isArray(emoticons)) {
      return NextResponse.json({ error: 'Invalid emoticons data' }, { status: 400 })
    }

    // Update the channel message with new emoticons
    const { error } = await supabase
      .from('channel_messages')
      .update({ emoticons })
      .eq('id', messageId)

    if (error) {
      console.error('Error updating message emoticons:', error)
      return NextResponse.json({ error: 'Failed to update emoticons' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in emoticons API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
