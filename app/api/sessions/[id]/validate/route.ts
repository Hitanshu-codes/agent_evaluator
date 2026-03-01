import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { runValidationChecks, hasErrorFlags } from '@/lib/validation'

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

    const flags = runValidationChecks({
      system_prompt: session.system_prompt,
      context_data: session.context_data,
      compiled_prompt: session.compiled_prompt
    })

    const hasErrors = hasErrorFlags(flags)
    const newStatus = hasErrors ? 'draft' : 'validated'

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        validation_flags: flags,
        status: newStatus
      })
      .eq('id', id)

    if (updateError) {
      console.error('Session update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save validation results' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      flags,
      status: newStatus,
      hasErrors
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'An error occurred during validation' },
      { status: 500 }
    )
  }
}
