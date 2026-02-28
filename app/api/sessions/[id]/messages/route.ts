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

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || [],
      count: messages?.length || 0
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching messages' },
      { status: 500 }
    )
  }
}
