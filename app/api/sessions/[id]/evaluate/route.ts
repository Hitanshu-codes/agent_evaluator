import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
// @ts-ignore - @google/genai types may not be available yet
import { GoogleGenAI } from '@google/genai'

const JUDGE_SYSTEM_PROMPT = `You are an AI prompt engineering evaluator for the Flipkart customer resolution team. Score prompts and agent conversations across 7 dimensions and provide actionable feedback.

Scoring scale (each dimension out of 10):
0-3: Missing or broken. 4-5: Present but weak. 6-7: Functional with gaps. 8-9: Strong. 10: Excellent.

Dimensions:

1. Role Definition: Is the agent's role, tone, scope, and boundaries clearly stated? Low: vague or missing. High: specifies exact domain, tone, and what is outside scope.

2. Structure: Are three layers present in the right order? Layer 1: Role. Layer 2: Must-do rules. Layer 3: Must-never rules. Low: rules mixed together or critical rules buried. High: layers separated, highest-stakes rules first.

3. Instruction Clarity: Are instructions commands with IF/THEN conditions and SAY/DO clauses, not policy explanations? Low: describes policy instead of commanding action, vague conditions. High: every scenario has a trigger, action, and response.

4. Examples: Are there examples with all three parts (data context, customer message, ideal response)? Do they cover hard scenarios? Low: missing, happy-path only, or incomplete. High: covers angry customers, wrong claims, and escalation.

5. Guardrails: Are there specific NEVER rules covering data safety, false promises, and hallucination prevention? Low: missing, vague, or buried in paragraphs. High: prominent, specific, covers data safety.

6. Failure Handling: Are there fallbacks for empty data fields, out-of-scope questions, and escalation to humans? Low: no fallback for missing data or uncovered scenarios. High: every field has a fallback, catch-all rule exists, escalation path is clear.

7. Conversation Quality: In the actual chat, did the agent follow instructions, handle pressure, stay accurate, and maintain tone? Low: contradicted rules, hallucinated, or caved under pressure. High: consistent, accurate, composed.

Overall score calculation (weights hidden from user):
Role Definition x1.2 + Structure x1.4 + Instruction Clarity x1.8 + Examples x1.6 + Guardrails x1.6 + Failure Handling x1.4 + Conversation Quality x1.0 = overall score out of 100. Round to nearest integer.

Return ONLY valid JSON. No preamble, no markdown fences, no explanation.
{
  "overall_score": <integer 0-100>,
  "dimensions": {
    "role_definition": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "structure": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "instruction_clarity": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "examples": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "guardrails": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "failure_handling": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" },
    "conversation_quality": { "score": <int 0-10>, "max": 10, "note": "<one sentence>" }
  },
  "prompt_efficiency": {
    "total_tokens": <integer>,
    "redundancy_flag": "<none / low / moderate / high>",
    "compression_suggestion": "<one specific sentence or rule that could be shortened or removed without losing function>"
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
        improvements: evaluation.improvements,
        prompt_efficiency: evaluation.prompt_efficiency
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
        prompt_efficiency: evaluation.prompt_efficiency,
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
