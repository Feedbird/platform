import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Get users with unread messages for notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint === 'users-with-unread-messages') {
      // Get all users with unread messages
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, first_name, unread_msg')
        .not('unread_msg', 'eq', '[]');

      if (error) {
        console.error('Error fetching users with unread messages:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      return NextResponse.json(users || []);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Error in notification service API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Handle various notification service operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids, channel_ids, author_emails } = body;

    if (message_ids) {
      // Get message details for notification processing
      const { data: messages, error } = await supabase
        .from('channel_messages')
        .select(`
          id,
          content,
          author_email,
          created_at,
          channel_id,
          workspace_id,
          sent_notification
        `)
        .in('id', message_ids);

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json(messages || []);
    }

    if (channel_ids) {
      // Get channel information
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name')
        .in('id', channel_ids);

      if (error) {
        console.error('Error fetching channels:', error);
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
      }

      return NextResponse.json(channels || []);
    }

    if (author_emails) {
      // Get authors information
      const { data: authors, error } = await supabase
        .from('users')
        .select('email, first_name, image_url')
        .in('email', author_emails);

      if (error) {
        console.error('Error fetching authors:', error);
        return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
      }

      return NextResponse.json(authors || []);
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error in notification service API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark messages as notification sent
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids } = body;

    if (!message_ids || !Array.isArray(message_ids)) {
      return NextResponse.json({ error: 'Invalid message_ids' }, { status: 400 });
    }

    const { error } = await supabase
      .from('channel_messages')
      .update({ sent_notification: true })
      .in('id', message_ids);

    if (error) {
      console.error('Error marking notifications as sent:', error);
      return NextResponse.json({ error: 'Failed to mark notifications as sent' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notification service API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
