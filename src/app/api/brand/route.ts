import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'
import { SECURE_SOCIAL_ACCOUNT_WITH_PAGES } from '@/lib/utils/secure-queries'

// Validation schemas
const CreateBrandSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  name: z.string().min(1, 'Brand name is required'),
  logo: z.string().url().optional().or(z.literal('')),
  style_guide: z.any().optional(),
  link: z.string().url().optional().or(z.literal('')),
  voice: z.string().optional(),
  prefs: z.string().optional(),
})

const UpdateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').optional(),
  logo: z.string().url().optional().or(z.literal('')),
  style_guide: z.any().optional(),
  link: z.string().url().optional().or(z.literal('')),
  voice: z.string().optional(),
  prefs: z.string().optional(),
})

// GET - Get brand by ID or list brands by workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const workspace_id = searchParams.get('workspace_id')
    const includeSocial = searchParams.get('include_social') === 'true'

    if (id) {
      // Get specific brand
      let data, error;
      
      if (includeSocial) {
        // Secure query that excludes sensitive tokens
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('id', id)
          .single();
          
        if (brandError) {
          error = brandError;
        } else if (brandData) {
          // Get social accounts without sensitive tokens (workspace scoped)
          const { data: accounts, error: accountsError } = await supabase
            .from('social_accounts')
            .select(SECURE_SOCIAL_ACCOUNT_WITH_PAGES)
            .eq('workspace_id', brandData.workspace_id);
            
          if (accountsError) {
            error = accountsError;
          } else {
            data = {
              ...brandData,
              social_accounts: accounts
            };
          }
        }
      } else {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('id', id)
          .single();
        data = brandData;
        error = brandError;
      }

      if (error) {
        console.error('Error fetching brand:', error)
        return NextResponse.json(
          { error: 'Failed to fetch brand' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    } else if (workspace_id) {
      // Get brand by workspace (one-to-one relationship)
      let data, error;
      
      if (includeSocial) {
        // Secure query that excludes sensitive tokens
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('workspace_id', workspace_id)
          .maybeSingle();
          
        if (brandError) {
          error = brandError;
        } else if (brandData) {
          // Get social accounts without sensitive tokens (workspace scoped)
          const { data: accounts, error: accountsError } = await supabase
            .from('social_accounts')
            .select(SECURE_SOCIAL_ACCOUNT_WITH_PAGES)
            .eq('workspace_id', workspace_id);
            
          if (accountsError) {
            error = accountsError;
          } else {
            data = {
              ...brandData,
              social_accounts: accounts
            };
          }
        } else {
          data = brandData; // null if no brand found
        }
      } else {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('workspace_id', workspace_id)
          .maybeSingle();
        data = brandData;
        error = brandError;
      }

      if (error) {
        console.error('Error fetching brand:', error)
        return NextResponse.json(
          { error: 'Failed to fetch brand' },
          { status: 500 }
        )
      }

      // Return null if no brand found for this workspace
      return NextResponse.json(data)
    } else {
      return NextResponse.json(
        { error: 'Either id or workspace_id parameter is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new brand
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateBrandSchema.parse(body)
    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validatedData.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Check if workspace already has a brand
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('workspace_id', validatedData.workspace_id)
      .single()

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Workspace already has a brand' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('brands')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating brand:', error)
      return NextResponse.json(
        { error: 'Failed to create brand' },
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

    console.error('Error in POST /api/brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update brand
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = UpdateBrandSchema.parse(body)

    const { data, error } = await supabase
      .from('brands')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating brand:', error)
      return NextResponse.json(
        { error: 'Failed to update brand' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Brand not found' },
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

    console.error('Error in PUT /api/brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete brand
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting brand:', error)
      return NextResponse.json(
        { error: 'Failed to delete brand' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Brand deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 