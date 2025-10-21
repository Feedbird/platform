import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration not found' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      supabaseUrl,
      supabaseAnonKey
    })
  } catch (error) {
    console.error('Error fetching Supabase config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Supabase configuration' },
      { status: 500 }
    )
  }
}
