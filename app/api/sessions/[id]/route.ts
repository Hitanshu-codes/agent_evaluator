import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const username = await getUserFromCookie()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the session' },
      { status: 500 }
    )
  }
}
