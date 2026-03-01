"use client"

import Link from "next/link"
import { Check, ArrowRight, Copy, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"

interface DimensionScore {
  score: number
  max: number
  note: string
}

interface PromptEfficiency {
  total_tokens: number
  redundancy_flag: 'none' | 'low' | 'moderate' | 'high'
  compression_suggestion: string
}

interface Evaluation {
  overall_score: number
  dimension_scores: {
    role_definition: DimensionScore
    structure: DimensionScore
    instruction_clarity: DimensionScore
    examples: DimensionScore
    guardrails: DimensionScore
    failure_handling: DimensionScore
    conversation_quality: DimensionScore
  }
  prompt_efficiency?: PromptEfficiency
  strengths: string[]
  improvements: string[]
}

interface Session {
  id: string
  problem_statement: string
  attempt_number: number
  status: string
  completed_at: string | null
  evaluation: Evaluation | null
  message_count: number
}

const DIMENSION_LABELS: Record<string, string> = {
  role_definition: "Role Definition",
  structure: "Structure",
  instruction_clarity: "Instruction Clarity",
  examples: "Examples",
  guardrails: "Guardrails",
  failure_handling: "Failure Handling",
  conversation_quality: "Conversation Quality"
}

function getScoreColor(score: number, max: number): string {
  const percent = (score / max) * 100
  if (percent >= 70) return "green"
  if (percent >= 50) return "yellow"
  return "red"
}

function getBarColorClass(color: string): string {
  if (color === "green") return "bg-green-600"
  if (color === "yellow") return "bg-yellow-500"
  return "bg-red-500"
}

function getOverallScoreStyle(score: number): { border: string; bg: string } {
  if (score >= 70) {
    return { border: "#1E7E34", bg: "rgba(30, 126, 52, 0.08)" }
  } else if (score >= 50) {
    return { border: "#EAB308", bg: "rgba(234, 179, 8, 0.08)" }
  }
  return { border: "#DC2626", bg: "rgba(220, 38, 38, 0.08)" }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function ScorePage() {
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    async function fetchSession() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session')
        }
        const data = await response.json()
        setSession(data)

        if (data.status === 'complete' && data.evaluation) {
          setIsLoading(false)
          if (pollInterval) {
            clearInterval(pollInterval)
          }
        } else if (data.status === 'evaluating') {
          setIsLoading(true)
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load session data')
        setIsLoading(false)
      }
    }

    fetchSession()

    pollInterval = setInterval(() => {
      if (session?.status !== 'complete') {
        fetchSession()
      }
    }, 2000)

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [sessionId])

  useEffect(() => {
    if (session?.status === 'complete') {
      setIsLoading(false)
    }
  }, [session?.status])

  async function copyScoreSummary() {
    if (!session?.evaluation) return

    const eval_ = session.evaluation
    const summary = `Score Card Summary
==================
Overall Score: ${eval_.overall_score}/100
Session: ${session.problem_statement}
Attempt: #${session.attempt_number}

Strengths:
${eval_.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Improvements:
${eval_.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading || !session?.evaluation) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-12" />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/session/new"
              className="bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
            >
              New Session
            </Link>
            <LogoutButton className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        </nav>

        <main className="max-w-[800px] mx-auto px-6 py-10">
          <div className="flex flex-col items-center py-20">
            <div className="w-[130px] h-[130px] rounded-full border-[6px] border-border bg-card flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            </div>
            <p className="mt-4 font-medium text-foreground">Evaluating your prompt</p>
            <p className="text-sm text-muted-foreground">This usually takes 10 to 15 seconds</p>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
          </div>
        </main>
      </div>
    )
  }

  const evaluation = session.evaluation
  const scoreStyle = getOverallScoreStyle(evaluation.overall_score)

  const dimensions = Object.entries(evaluation.dimension_scores).map(([key, value]) => ({
    key,
    name: DIMENSION_LABELS[key] || key,
    score: value.score,
    max: value.max,
    percent: Math.round((value.score / value.max) * 100),
    color: getScoreColor(value.score, value.max),
    note: value.note
  }))

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard">
          <img src="/logo.png" alt="Nudgeable" className="h-12" />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/session/new"
            className="bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
          >
            New Session
          </Link>
          <LogoutButton className="text-sm text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 py-10 pb-24">
        {/* Overall Score */}
        <div className="flex flex-col items-center mb-12">
          <div
            className="w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center"
            style={{
              border: `6px solid ${scoreStyle.border}`,
              backgroundColor: scoreStyle.bg
            }}
          >
            <span className="font-mono font-bold text-[42px] leading-none text-foreground">
              {evaluation.overall_score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-4 font-bold text-foreground">
            Attempt {session.attempt_number} — {session.problem_statement.length > 40
              ? session.problem_statement.substring(0, 40) + '...'
              : session.problem_statement}
          </p>
          <p className="text-sm text-muted-foreground">
            Evaluated on {formatDate(session.completed_at)} · {session.message_count} exchanges
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">Score Breakdown</h2>
          <div className="space-y-5">
            {dimensions.map((dim) => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{dim.name}</span>
                  <span className="font-mono font-bold text-foreground">{dim.score}/{dim.max}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full ${getBarColorClass(dim.color)} rounded-full transition-all`}
                    style={{ width: `${dim.percent}%` }}
                  />
                </div>
                <p className="text-sm italic text-muted-foreground">{dim.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt Efficiency */}
        {evaluation.prompt_efficiency && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-6">Prompt Efficiency</h2>
            <div className="p-4 bg-card border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Tokens</span>
                <span className="font-mono font-bold text-foreground">{evaluation.prompt_efficiency.total_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Redundancy</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-sm ${evaluation.prompt_efficiency.redundancy_flag === 'none' ? 'bg-green-100 text-green-700' :
                    evaluation.prompt_efficiency.redundancy_flag === 'low' ? 'bg-blue-100 text-blue-700' :
                      evaluation.prompt_efficiency.redundancy_flag === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                  }`}>
                  {evaluation.prompt_efficiency.redundancy_flag}
                </span>
              </div>
              {evaluation.prompt_efficiency.compression_suggestion && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Compression Suggestion</p>
                  <p className="text-sm text-foreground italic">{evaluation.prompt_efficiency.compression_suggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strengths and Improvements */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">Strengths and Improvements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* What Worked */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700">What Worked</span>
              </div>
              <div className="space-y-3">
                {evaluation.strengths.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-sm text-green-800"
                    style={{ backgroundColor: "rgba(30, 126, 52, 0.1)" }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Improve Next Time */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-700">Improve Next Time</span>
              </div>
              <div className="space-y-3">
                {evaluation.improvements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card border-l-4 border-yellow-500 text-sm text-foreground"
                  >
                    <span className="font-semibold">{idx + 1}.</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/session/new?from=${sessionId}`}
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="border-2 border-foreground text-foreground font-semibold px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
          >
            View All Sessions
          </Link>
          <button
            onClick={copyScoreSummary}
            className="ml-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Score Summary'}
          </button>
        </div>
      </main>
    </div>
  )
}
