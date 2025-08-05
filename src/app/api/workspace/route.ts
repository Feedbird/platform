import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'

// Validation schemas
const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  logo: z.string().url().optional().or(z.literal('')),
  email: z.string().email('Valid email is required'),
})

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').optional(),
  logo: z.string().url().optional().or(z.literal('')),
})

// GET - Get workspace by ID or list workspaces by creator
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const email = searchParams.get('email') // Logged-in user email for aggregate fetch
    const createdBy = searchParams.get('createdby')

    if (id) {
      // Get specific workspace
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching workspace:', error)
        return NextResponse.json(
          { error: 'Failed to fetch workspace' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    } else if (email) {
      /* ------------------------------------------------------------
       *  Workspaces & boards the user has access to (creator + invites)
       * ----------------------------------------------------------*/
      // 1️⃣  Workspaces created by the user (role: admin)
      const { data: createdWorkspaces, error: createdError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('createdby', email)

      if (createdError) {
        console.error('Error fetching created workspaces:', createdError)
        return NextResponse.json(
          { error: 'Failed to fetch user workspaces' },
          { status: 500 }
        )
      }

      // 2️⃣  Membership rows where the user is invited
      const { data: memberRows, error: memberErr } = await supabase
        .from('members')
        .select('workspace_id, board_id, is_workspace')
        .eq('email', email)

      if (memberErr) {
        console.error('Error fetching membership rows:', memberErr)
        return NextResponse.json(
          { error: 'Failed to fetch member rows' },
          { status: 500 }
        )
      }

      const invitedWorkspaceIds = Array.from(new Set(memberRows.map(r => r.workspace_id)))
        .filter(id => !createdWorkspaces?.some(w => w.id === id)) // exclude already-created ones

      // 3️⃣  Fetch invited workspaces (role: member)
      let invitedWorkspaces: any[] = []
      if (invitedWorkspaceIds.length) {
        const { data: invitedData, error: invitedErr } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', invitedWorkspaceIds)

        if (invitedErr) {
          console.error('Error fetching invited workspaces:', invitedErr)
          return NextResponse.json(
            { error: 'Failed to fetch invited workspaces' },
            { status: 500 }
          )
        }
        invitedWorkspaces = invitedData || []
      }

      // 4️⃣  Collect ALL workspace ids to fetch boards in bulk
      const allWorkspaceIds = [
        ...(createdWorkspaces?.map(w => w.id) || []),
        ...invitedWorkspaceIds,
      ]

      // Fetch boards belonging to these workspaces
      let boards: any[] = []
      if (allWorkspaceIds.length) {
        const { data: boardData, error: boardErr } = await supabase
          .from('boards')
          .select('*')
          .in('workspace_id', allWorkspaceIds)

        if (boardErr) {
          console.error('Error fetching boards:', boardErr)
          return NextResponse.json(
            { error: 'Failed to fetch boards' },
            { status: 500 }
          )
        }
        boards = boardData || []
      }

      // 5️⃣  Assemble response with role + board access rules
      const buildWs = (ws: any, role: 'admin' | 'member') => {
        let wsBoards: any[] = []
        if (role === 'admin') {
          wsBoards = boards.filter(b => b.workspace_id === ws.id)
        } else {
          const rowsForWs = memberRows.filter(r => r.workspace_id === ws.id)
          const hasWorkspaceInvite = rowsForWs.some(r => r.is_workspace)
          if (hasWorkspaceInvite) {
            wsBoards = boards.filter(b => b.workspace_id === ws.id)
          } else {
            const allowedBoardIds = rowsForWs.filter(r => !r.is_workspace).map(r => r.board_id)
            wsBoards = boards.filter(b => allowedBoardIds.includes(b.id))
          }
        }
        return { ...ws, role, boards: wsBoards }
      }

      const responsePayload = [
        ...(createdWorkspaces || []).map(ws => buildWs(ws, 'admin')),
        ...(invitedWorkspaces || []).map(ws => buildWs(ws, 'member')),
      ]

      return NextResponse.json(responsePayload)

    } else if (createdBy) {
      // Get workspaces created by specific user
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('createdby', createdBy)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workspaces:', error)
        return NextResponse.json(
          { error: 'Failed to fetch workspaces' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // Get all workspaces (fallback for backward compatibility)
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workspaces:', error)
        return NextResponse.json(
          { error: 'Failed to fetch workspaces' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error in GET /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new workspace
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateWorkspaceSchema.parse(body)
    console.log("validatedData", validatedData);
    // Use the email from request body as the creator
    const workspaceData = {
      name: validatedData.name,
      logo: validatedData.logo,
      createdby: validatedData.email
    }
    
    const { data, error } = await supabase
      .from('workspaces')
      .insert([workspaceData])
      .select()
      .single()

    if (error) {
      console.error('Error creating workspace:', error)
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update workspace
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdateWorkspaceSchema.parse(body)

    const { data, error } = await supabase
      .from('workspaces')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating workspace:', error)
      return NextResponse.json(
        { error: 'Failed to update workspace' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete workspace
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting workspace:', error)
      return NextResponse.json(
        { error: 'Failed to delete workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 