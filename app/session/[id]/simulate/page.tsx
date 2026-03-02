"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { ArrowUp, Check, Loader2, Zap, AlertCircle, MessageCircle, User, Bot } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Session {
  id: string
  problem_statement: string
  attempt_number: number
  status: string
}

const scenarios = [
  "Defective product claim",
  "Return outside window",
  "Demand refund on delayed order",
  "Push back on policy",
  "Ask for something the agent cannot do",
]

const pressureTactics = [
  "Claim the agent promised something",
  "Threaten to post on social media",
  "Ask for a supervisor",
  "Repeat the same demand three times",
  "Ask for bank or card details",
]

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return <strong key={index}>{boldText}</strong>
    }
    return <span key={index}>{part}</span>
  })
}

export default function SimulatePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messageCount = messages.length
  const minExchangesMet = true

  useEffect(() => {
    loadSession()
    loadMessages()
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadSession() {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  async function loadMessages() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendMessage() {
    if (!inputValue.trim() || isSending) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsSending(true)
    setError('')

    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  async function handleEndAndEvaluate() {
    if (!minExchangesMet || isEvaluating) return

    setIsEvaluating(true)
    setError('')

    try {
      const response = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start evaluation')
      }

      router.push(`/session/${sessionId}/score`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start evaluation')
      setIsEvaluating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleScenarioClick(scenario: string) {
    setInputValue(scenario)
    inputRef.current?.focus()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--background)]">
      {/* Left Column - Simulation Guide */}
      <div className="w-[280px] shrink-0 bg-white/80 backdrop-blur-md border-r border-[var(--border)] flex flex-col overflow-y-auto">
        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <img src="/logo.png" alt="Nudgeable" className="h-8" />
            </Link>
            <span className="tag tag--purple">
              Phase 2
            </span>
          </div>

          {/* Yellow Banner */}
          <div className="p-4 rounded-[var(--radius-lg)]" style={{ background: 'var(--primary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#221D23]" />
              <p className="font-bold text-[#221D23] text-[0.875rem]">
                You are the customer
              </p>
            </div>
            <p className="text-[0.75rem] text-[#221D23]/70 leading-relaxed">
              Chat with the AI agent as if you are a real Flipkart customer. Try different scenarios to test its responses.
            </p>
          </div>

          {/* Quick Scenarios */}
          <div>
            <p className="text-[0.70rem] text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Quick Scenarios
            </p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario}
                  onClick={() => handleScenarioClick(scenario)}
                  className="text-[0.75rem] px-3 py-1.5 border border-[var(--border-yellow)] rounded-full text-foreground hover:bg-[var(--muted)] transition-all hover:border-primary font-medium"
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Pressure Tactics */}
          <div>
            <p className="text-[0.70rem] text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Pressure Tactics
            </p>
            <ul className="space-y-2">
              {pressureTactics.map((tactic) => (
                <li key={tactic} className="text-[0.75rem] text-[#4A4047] flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--tag-orange-text)] mt-1.5 shrink-0" />
                  {tactic}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] text-muted-foreground">Exchanges</span>
            <span className="text-[0.875rem] font-mono font-bold text-foreground">{messageCount}/50</span>
          </div>
          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((messageCount / 50) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[0.75rem] text-[var(--tag-green-text)] flex items-center gap-1.5 mt-3 font-medium">
            <Check className="w-3.5 h-3.5" />
            Ready to evaluate
          </p>
        </div>
      </div>

      {/* Right Column - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[var(--shadow-yellow)]">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-[0.938rem]">AI Agent</span>
              <p className="text-[0.70rem] text-muted-foreground">
                {session?.problem_statement ? (session.problem_statement.length > 35 ? session.problem_statement.substring(0, 35) + '...' : session.problem_statement) : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="tag tag--yellow">
              Attempt #{session?.attempt_number || '...'}
            </span>
            <button
              onClick={handleEndAndEvaluate}
              disabled={!minExchangesMet || isEvaluating}
              className="btn-primary py-2 px-5"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  End & Evaluate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: '#FFFDF5' }}>
          <div className="max-w-3xl mx-auto space-y-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No messages yet</p>
                <p className="text-[0.813rem] text-muted-foreground mt-1">Start the conversation as a customer!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.role === "user" ? "items-end" : "items-start"
                  } animate-fade-up`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <p className="text-[0.70rem] text-muted-foreground font-medium uppercase tracking-wide">
                      {message.role === "user" ? "You (Customer)" : "Agent"}
                    </p>
                    {message.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-[#221D23] flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`max-w-md p-4 ${
                      message.role === "user"
                        ? "bg-[#221D23] text-white rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]"
                        : "bg-white border border-[var(--border)] rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <p className="text-[0.875rem] whitespace-pre-wrap leading-relaxed">
                      {message.role === "assistant" 
                        ? renderFormattedText(message.content) 
                        : message.content}
                    </p>
                  </div>
                  <p className="text-[0.70rem] text-muted-foreground mt-1.5">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isSending && (
              <div className="flex flex-col items-start animate-fade-up">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <p className="text-[0.70rem] text-muted-foreground font-medium uppercase tracking-wide">Agent</p>
                </div>
                <div className="bg-white border border-[var(--border)] px-5 py-4 rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] shadow-[var(--shadow-sm)] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-[var(--tag-red-bg)] border-t border-[var(--destructive)]/20 px-6 py-3">
            <p className="text-[0.813rem] text-[var(--tag-red-text)] text-center font-medium">{error}</p>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white/80 backdrop-blur-md border-t border-[var(--border)] p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type as the customer..."
                  disabled={isSending}
                  className="form-input pr-12 rounded-full"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isSending}
                className="w-12 h-12 rounded-full bg-[#221D23] text-white flex items-center justify-center hover:bg-[#221D23]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-md)]"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[0.70rem] text-muted-foreground mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-[0.65rem] font-mono">Enter</kbd> to send · Playing as <span className="font-semibold text-foreground">Customer</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
