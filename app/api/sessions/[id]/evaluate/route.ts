import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
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

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', id)

    const messageCount = count || 0

    if (messageCount < 6) {
      return NextResponse.json(
        { error: 'Minimum of 6 exchanges required before evaluation' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        status: 'evaluating',
        evaluated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating session status:', updateError)
      return NextResponse.json(
        { error: 'Failed to start evaluation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session_id: id,
      messageCount
    })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'An error occurred during evaluation' },
      { status: 500 }
    )
  }
}
