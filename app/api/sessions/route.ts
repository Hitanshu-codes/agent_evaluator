import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie, getOrCreateUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const username = await getUserFromCookie()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getOrCreateUser(username)

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sessions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    console.log('Sessions found:', sessions?.length || 0)

    const sessionsWithEval = await Promise.all(
      (sessions || []).map(async (session) => {
        let evaluation = null
        if (session.status === 'complete') {
          const { data: evalData } = await supabase
            .from('evaluations')
            .select('overall_score, dimension_scores, strengths, improvements')
            .eq('session_id', session.id)
            .single()
          evaluation = evalData
        }
        return { ...session, evaluation }
      })
    )

    return NextResponse.json({ sessions: sessionsWithEval })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const username = await getUserFromCookie()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getOrCreateUser(username)
    
    const body = await request.json()
    const { problem_statement, system_prompt, use_case_prompt, context_data } = body

    if (!problem_statement || !system_prompt) {
      return NextResponse.json(
        { error: 'Problem statement and system prompt are required' },
        { status: 400 }
      )
    }

    const compiled_prompt = [
      system_prompt,
      use_case_prompt || '',
      context_data || ''
    ].filter(Boolean).join('\n\n---\n\n')

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('problem_statement', problem_statement)

    const attempt_number = (count || 0) + 1

    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        problem_statement,
        system_prompt,
        use_case_prompt: use_case_prompt || null,
        context_data: context_data || null,
        compiled_prompt,
        attempt_number,
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Session insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      session_id: session.id,
      attempt_number 
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the session' },
      { status: 500 }
    )
  }
}
