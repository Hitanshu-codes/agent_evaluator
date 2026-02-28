import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
// @ts-ignore - @google/genai types may not be available yet
import { GoogleGenAI } from '@google/genai'

const JUDGE_SYSTEM_PROMPT = `You are an expert AI prompt engineering evaluator for the Flipkart customer resolution team. Your job is to score prompts across 9 dimensions and provide actionable feedback.

Score the prompt and conversation across these 9 dimensions:

1. Agent Identity Clarity (max 11): How clearly is the agent's role, name, tone, and persona defined?
2. Structural Completeness (max 12): Are all three layers present - job description, always-do rules, never-do rules?
3. Instruction Precision (max 12): Are instructions specific with IF/THEN conditions and SAY clauses?
4. Few-Shot Examples (max 11): Are there examples covering simple and hard edge cases?
5. Guardrails and Pressure Holding (max 12): Does the agent maintain boundaries under customer pressure?
6. Edge Case Coverage (max 11): Are unusual scenarios like cancellation-in-transit anticipated?
7. PII and Data Discipline (max 11): Does the agent avoid requesting or exposing sensitive data?
8. Prompt Failure Anticipation (max 10): Are fallback instructions defined for unresolvable situations?
9. Eval Readiness (max 10): Are instructions testable and measurable?

Return ONLY valid JSON with no preamble, no markdown code fences, and no explanation. The JSON must have this exact structure:
{
  "overall_score": <integer 0-100>,
  "dimensions": {
    "agent_identity_clarity": { "score": <int>, "max": 11, "note": "<one sentence>" },
    "structural_completeness": { "score": <int>, "max": 12, "note": "<one sentence>" },
    "instruction_precision": { "score": <int>, "max": 12, "note": "<one sentence>" },
    "few_shot_examples": { "score": <int>, "max": 11, "note": "<one sentence>" },
    "guardrails_pressure_holding": { "score": <int>, "max": 12, "note": "<one sentence>" },
    "edge_case_coverage": { "score": <int>, "max": 11, "note": "<one sentence>" },
    "pii_data_discipline": { "score": <int>, "max": 11, "note": "<one sentence>" },
    "prompt_failure_anticipation": { "score": <int>, "max": 10, "note": "<one sentence>" },
    "eval_readiness": { "score": <int>, "max": 10, "note": "<one sentence>" }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<specific rewrite suggestion 1>", "<specific rewrite suggestion 2>", "<specific rewrite suggestion 3>"]
}`

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

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    const messageCount = messages?.length || 0

    await supabase
      .from('sessions')
      .update({ status: 'evaluating' })
      .eq('id', id)

    const transcript = (messages || [])
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    const evaluationPrompt = `Please evaluate the following prompt engineering session:

PROBLEM STATEMENT:
${session.problem_statement}

SYSTEM PROMPT (being evaluated):
${session.compiled_prompt}

CONVERSATION TRANSCRIPT (${messageCount} messages):
${transcript}

Based on the system prompt quality and how the agent performed in the conversation, provide your evaluation.`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: evaluationPrompt,
      config: {
        systemInstruction: JUDGE_SYSTEM_PROMPT,
        responseMimeType: 'application/json'
      }
    })

    let jsonText = response.text || ''
    jsonText = jsonText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let evaluation
    try {
      evaluation = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', jsonText)
      return NextResponse.json(
        { error: 'Failed to parse evaluation response' },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabase
      .from('evaluations')
      .insert({
        session_id: id,
        overall_score: evaluation.overall_score,
        dimension_scores: evaluation.dimensions,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements
      })

    if (insertError) {
      console.error('Error inserting evaluation:', insertError)
      return NextResponse.json(
        { error: 'Failed to save evaluation' },
        { status: 500 }
      )
    }

    const { error: updateError, data: updatedSession } = await supabase
      .from('sessions')
      .update({ 
        status: 'complete',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (updateError) {
      console.error('Error updating session status:', updateError)
    } else {
      console.log('Session status updated to complete:', updatedSession)
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        overall_score: evaluation.overall_score,
        dimensions: evaluation.dimensions,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements
      }
    })
  } catch (error: unknown) {
    console.error('Evaluation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please wait a moment and try again.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'An error occurred during evaluation' },
      { status: 500 }
    )
  }
}
