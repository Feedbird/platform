import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { jsonCamel } from '@/lib/utils/http'

// GET - Get all activities for a workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Get activities with user data and post information
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        *,
        actor:users!actor_id(
          id,
          first_name,
          last_name,
          email,
          image_url
        ),
        post:posts!post_id(*)
      `)
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Map DB rows to the Activity interface shape
    const mapped = (activities ?? []).map((a: any) => {
      const meta = a?.metadata ?? undefined
      return {
        id: a.id,
        workspaceId: a.workspace_id,
        postId: a.post_id ?? undefined,
        type: a.type,
        actorId: a.actor_id,
        actor: a.actor
          ? {
              id: a.actor.id,
              firstName: a.actor.first_name ?? undefined,
              lastName: a.actor.last_name ?? undefined,
              email: a.actor.email ?? undefined,
              imageUrl: a.actor.image_url ?? undefined,
            }
          : undefined,
        metadata: meta
          ? {
              versionNumber:
                meta.versionNumber ?? meta.version_number ?? undefined,
              comment: meta.comment ?? undefined,
              publishTime:
                meta.publishTime
                  ? new Date(meta.publishTime)
                  : meta.publish_time
                  ? new Date(meta.publish_time)
                  : undefined,
              revisionComment:
                meta.revisionComment ?? meta.revision_comment ?? undefined,
              commentId: meta.commentId ?? meta.comment_id ?? undefined,
              invitedEmail: meta.invitedEmail ?? meta.invited_email ?? undefined,
              boardId: meta.boardId ?? meta.board_id ?? undefined,
              workspaceId: meta.workspaceId ?? meta.workspace_id ?? undefined,
            }
          : undefined,
        createdAt: a.created_at ? new Date(a.created_at) : new Date(),
        updatedAt: a.updated_at ? new Date(a.updated_at) : new Date(),
      }
    })

    return jsonCamel(mapped)
  } catch (error) {
    console.error('Error in GET /api/workspace/activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
