import { NextRequest, NextResponse } from 'next/server'
import { syncUserToDatabase, updateUserInDatabase } from '@/lib/supabase/user-sync'
import { Webhook } from 'svix'
import { headers } from 'next/headers'

// Webhook secret from Clerk
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 Webhook received')
    
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    console.log('📋 Webhook headers:', { svix_id, svix_timestamp, svix_signature: svix_signature ? 'present' : 'missing' })

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing webhook headers')
      return new Response('Error occured -- no svix headers', {
        status: 400,
      })
    }

    // Get the body
    const payload = await req.text()
    const body = JSON.parse(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(webhookSecret || '')

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response('Error occured', {
        status: 400,
      })
    }

    // Handle the webhook
    const eventType = evt.type
    console.log('📦 Webhook event type:', eventType)

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      // Get the primary email
      const primaryEmail = email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id)
      
      console.log('📧 User data:', { 
        id, 
        email: primaryEmail?.email_address, 
        first_name, 
        last_name,
        primary_email_id: evt.data.primary_email_address_id 
      })
      
      if (primaryEmail) {
        const userData = {
          email: primaryEmail.email_address,
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          image_url: image_url || undefined,
        }

        console.log('💾 Attempting to sync user data:', userData)

        try {
          await syncUserToDatabase(userData)
          console.log('✅ User synced to database:', primaryEmail.email_address)
        } catch (error) {
          console.error('❌ Error syncing user to database:', error)
          return NextResponse.json(
            { error: 'Failed to sync user to database' },
            { status: 500 }
          )
        }
      } else {
        console.error('❌ No primary email found for user:', id)
      }
    } else if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      // Get the primary email
      const primaryEmail = email_addresses?.find((email: any) => email.id === evt.data.primary_email_address_id)
      
      if (primaryEmail) {
        const updates: any = {}
        
        if (first_name !== undefined) updates.first_name = first_name
        if (last_name !== undefined) updates.last_name = last_name
        if (image_url !== undefined) updates.image_url = image_url

        if (Object.keys(updates).length > 0) {
          try {
            // First try to find user by email
            const user = await getUserFromDatabase(primaryEmail.email_address)
            if (user) {
              await updateUserInDatabase(user.id, updates)
              console.log('User updated in database:', primaryEmail.email_address)
            }
          } catch (error) {
            console.error('Error updating user in database:', error)
            return NextResponse.json(
              { error: 'Failed to update user in database' },
              { status: 500 }
            )
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get user from database
async function getUserFromDatabase(email: string) {
  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user from database:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user from database:', error)
    return null
  }
} 