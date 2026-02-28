import { NextResponse } from 'next/server'
import { getUserFromCookie, getOrCreateUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface Attempt {
  attempt_number: number
  overall_score: number
  created_at: string
  session_id: string
  dimension_scores: Record<string, { score: number; max: number; note: string }> | null
}

interface UseCase {
  problem_statement: string
  attempts: Attempt[]
  last_updated: string
}

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
      .eq('status', 'complete')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Progress fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    console.log('Complete sessions found:', sessions?.length || 0)

    const useCaseMap = new Map<string, UseCase>()

    for (const session of sessions || []) {
      const { data: evaluation } = await supabase
        .from('evaluations')
        .select('overall_score, dimension_scores')
        .eq('session_id', session.id)
        .single()

      if (!evaluation) {
        console.log('No evaluation found for session:', session.id)
        continue
      }

      const attempt: Attempt = {
        attempt_number: session.attempt_number,
        overall_score: evaluation.overall_score,
        created_at: session.created_at,
        session_id: session.id,
        dimension_scores: evaluation.dimension_scores
      }

      if (useCaseMap.has(session.problem_statement)) {
        const useCase = useCaseMap.get(session.problem_statement)!
        useCase.attempts.push(attempt)
        if (new Date(session.created_at) > new Date(useCase.last_updated)) {
          useCase.last_updated = session.created_at
        }
      } else {
        useCaseMap.set(session.problem_statement, {
          problem_statement: session.problem_statement,
          attempts: [attempt],
          last_updated: session.created_at
        })
      }
    }

    const useCases = Array.from(useCaseMap.values())
      .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())

    return NextResponse.json({ useCases })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching progress' },
      { status: 500 }
    )
  }
}
