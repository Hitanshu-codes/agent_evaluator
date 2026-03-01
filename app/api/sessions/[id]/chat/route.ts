import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
// @ts-ignore - @google/genai types may not be available yet
import { GoogleGenAI } from '@google/genai'

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
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError) {
      console.error('Session fetch error:', sessionError)
      return NextResponse.json(
        { error: `Session error: ${sessionError.message}` },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const { data: existingMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch message history' },
        { status: 500 }
      )
    }

    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> =
      (existingMessages || []).map(msg => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }]
      }))

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const chat = await ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: session.compiled_prompt,
        temperature: 0.5
      }
    })

    const response = await chat.sendMessage({ message })
    const replyText = response.text || ''

    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: id,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    const { error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: id,
        role: 'assistant',
        content: replyText
      })

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
    }

    if (session.status === 'draft') {
      await supabase
        .from('sessions')
        .update({ status: 'simulating' })
        .eq('id', id)
    }

    const totalMessages = (existingMessages?.length || 0) + 2

    return NextResponse.json({
      reply: replyText,
      messageCount: totalMessages
    })
  } catch (error: unknown) {
    console.error('Chat error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please wait a moment and try again, or the daily limit may have been reached.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during chat. Please try again.' },
      { status: 500 }
    )
  }
}
