"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { ArrowUp, Check, Loader2 } from "lucide-react"

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
    <div className="h-screen flex overflow-hidden">
      {/* Left Column */}
      <div className="w-[260px] shrink-0 bg-secondary border-r border-border flex flex-col overflow-y-auto">
        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Header */}
          <p className="text-xs font-mono text-primary uppercase tracking-wider">
            Simulation Guide
          </p>

          {/* Yellow Banner */}
          <div className="bg-primary p-3 rounded-lg">
            <p className="font-bold text-primary-foreground text-sm">
              You are playing the customer.
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Chat with the agent as if you are a Flipkart customer. Try to pressure-test it.
            </p>
          </div>

          {/* Quick Scenarios */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Quick Scenarios
            </p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario}
                  onClick={() => handleScenarioClick(scenario)}
                  className="text-xs px-2 py-1 border border-primary rounded-full text-foreground hover:bg-primary/10 transition-colors"
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Pressure Tactics */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Pressure Tactics
            </p>
            <ul className="space-y-1">
              {pressureTactics.map((tactic) => (
                <li key={tactic} className="text-xs text-muted-foreground">
                  {tactic}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="p-4 border-t border-border">
          <p className="text-xs font-mono text-foreground">{messageCount} / 50 exchanges</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <Check className="w-3 h-3" />
            Ready to evaluate
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">A</span>
            </div>
            <span className="font-bold text-foreground">Agent</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Agent
            </span>
          </div>

          <div className="flex items-center gap-2 text-center">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {session?.problem_statement || 'Loading...'}
            </span>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              Attempt #{session?.attempt_number || '...'}
            </span>
          </div>

          <button
            onClick={handleEndAndEvaluate}
            disabled={!minExchangesMet || isEvaluating}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              'End and Evaluate'
            )}
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-card p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {message.role === "user" ? "You — Customer" : "Agent"}
                  </p>
                  <div
                    className={`max-w-md p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-card border border-foreground text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === "assistant" 
                        ? renderFormattedText(message.content) 
                        : message.content}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isSending && (
              <div className="flex flex-col items-start">
                <p className="text-xs text-muted-foreground mb-1">Agent</p>
                <div className="bg-primary px-4 py-3 rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-card border-t border-border p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type as the customer..."
                disabled={isSending}
                className="flex-1 px-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isSending}
                className="bg-foreground text-card p-3 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Enter to send · Playing as: <span className="text-foreground">Customer</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
