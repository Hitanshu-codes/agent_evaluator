"use client"

import Link from "next/link"
import { Check, AlertTriangle, Copy, Loader2, BarChart3, ArrowRight, ChevronLeft, RefreshCw, Sparkles } from "lucide-react"
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

function getScorePercent(score: number, max: number): number {
  return Math.round((score / max) * 100)
}

function getVerdict(score: number, max: number): { label: string; tagClass: string } {
  const percent = (score / max) * 100
  if (percent >= 70) return { label: "EXCELLENT", tagClass: "tag--green" }
  if (percent >= 50) return { label: "GOOD", tagClass: "tag--yellow" }
  return { label: "GAP", tagClass: "tag--red" }
}

function getBarColor(score: number, max: number): string {
  const percent = (score / max) * 100
  if (percent >= 70) return "bg-[var(--success)]"
  if (percent >= 50) return "bg-[var(--warning)]"
  return "bg-[var(--destructive)]"
}

function getOverallScoreStyle(score: number): { border: string; bg: string; tagClass: string } {
  if (score >= 70) {
    return { border: "var(--success)", bg: "var(--tag-green-bg)", tagClass: "tag--green" }
  } else if (score >= 50) {
    return { border: "var(--warning)", bg: "var(--tag-yellow-bg)", tagClass: "tag--yellow" }
  }
  return { border: "var(--destructive)", bg: "var(--tag-red-bg)", tagClass: "tag--red" }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_/g, ' ')
    .replace(/`/g, '')
    .trim()
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
  const [dimensionFilter, setDimensionFilter] = useState('')

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
      <div className="page-bg">
        <header className="navbar">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/session/new" className="btn-primary py-2 px-5">
              New Session
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="max-w-[800px] mx-auto px-6 py-10">
          <div className="nudge-card text-center py-16 animate-pop">
            <div className="w-[140px] h-[140px] rounded-full border-[6px] border-[var(--border)] bg-white flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <h2 className="text-[1.25rem] font-bold text-foreground mb-2">Evaluating your prompt</h2>
            <p className="text-muted-foreground">This usually takes 10 to 15 seconds</p>
            
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            
            {error && (
              <div className="mt-6 p-3 rounded-[var(--radius-md)] bg-[var(--tag-red-bg)]">
                <p className="text-[0.875rem] text-[var(--tag-red-text)] font-medium">{error}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  const evaluation = session.evaluation
  const scoreStyle = getOverallScoreStyle(evaluation.overall_score)

  const dimensions = Object.entries(evaluation.dimension_scores).map(([key, value], index) => ({
    key,
    index: index + 1,
    name: DIMENSION_LABELS[key] || key,
    score: value.score,
    max: value.max,
    verdict: getVerdict(value.score, value.max),
    barColor: getBarColor(value.score, value.max),
    note: value.note
  }))

  const filteredDimensions = dimensions.filter(dim =>
    dim.name.toLowerCase().includes(dimensionFilter.toLowerCase())
  )

  return (
    <div className="page-bg pb-24">
      <header className="navbar">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="w-9 h-9 rounded-full border border-[var(--border-strong)] bg-white/80 flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A4047]" />
          </Link>
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-10" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="tag tag--purple">Phase 3</span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-[920px] mx-auto px-6 py-10">
        {/* Overall Score Hero */}
        <div className="nudge-card text-center mb-10 animate-pop">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-[0.813rem] font-semibold text-muted-foreground uppercase tracking-wider">Evaluation Complete</span>
          </div>
          
          <div
            className="w-[150px] h-[150px] rounded-full flex flex-col items-center justify-center mx-auto mb-6"
            style={{
              border: `6px solid ${scoreStyle.border}`,
              backgroundColor: scoreStyle.bg
            }}
          >
            <span className="font-mono font-bold text-[52px] leading-none text-foreground">
              {evaluation.overall_score}
            </span>
            <span className="text-[0.875rem] text-muted-foreground">/100</span>
          </div>
          
          <h1 className="text-[1.25rem] font-bold text-foreground mb-2">
            Attempt {session.attempt_number} — {session.problem_statement.length > 45
              ? session.problem_statement.substring(0, 45) + '...'
              : session.problem_statement}
          </h1>
          <p className="text-[0.875rem] text-muted-foreground">
            Evaluated on {formatDate(session.completed_at)} · {session.message_count} exchanges
          </p>
        </div>

        {/* Key Strengths & Critical Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-10 animate-fade-up delay-1">
          {/* Key Strengths Card */}
          <div className="nudge-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-[var(--tag-green-bg)] flex items-center justify-center">
                <Check className="w-4 h-4 text-[var(--tag-green-text)]" />
              </div>
              <span className="font-bold text-[var(--tag-green-text)] uppercase tracking-wide text-[0.813rem]">Key Strengths</span>
            </div>
            <ul className="space-y-3">
              {evaluation.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[0.875rem] text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mt-2 shrink-0" />
                  <span>{stripMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critical Actions Card */}
          <div className="nudge-card" style={{ borderLeft: '4px solid var(--destructive)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-[var(--tag-red-bg)] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[var(--tag-red-text)]" />
              </div>
              <span className="font-bold text-[var(--tag-red-text)] uppercase tracking-wide text-[0.813rem]">Critical Actions</span>
            </div>
            <div className="space-y-4">
              {evaluation.improvements.map((item, idx) => {
                const cleanedItem = stripMarkdown(item)
                const parts = cleanedItem.split(':')
                const title = parts.length > 1 ? parts[0].trim() : `Action ${idx + 1}`
                const description = parts.length > 1 ? parts.slice(1).join(':').trim() : cleanedItem
                return (
                  <div key={idx}>
                    <p className="font-semibold text-foreground text-[0.875rem]">{title}</p>
                    <p className="text-[0.813rem] text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Prompt Dimension Detail Table */}
        <div className="nudge-card mb-10 animate-fade-up delay-2 p-0 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--secondary)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground uppercase tracking-wide text-[0.813rem]">Prompt Dimension Detail</span>
            </div>
            <input
              type="text"
              placeholder="Filter dimensions..."
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              className="form-input w-48 py-2 text-[0.813rem]"
            />
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] text-left bg-white/50">
                  <th className="px-6 py-3 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-3 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Dimension</th>
                  <th className="px-6 py-3 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider w-28">Score</th>
                  <th className="px-6 py-3 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider w-28">Verdict</th>
                  <th className="px-6 py-3 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredDimensions.map((dim) => (
                  <tr key={dim.key} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="px-6 py-4 text-[0.875rem] text-muted-foreground">{dim.index}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground text-[0.875rem]">{dim.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono font-bold text-foreground text-[0.875rem]">{dim.score}/{dim.max}</span>
                        <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${dim.barColor} rounded-full transition-all`}
                            style={{ width: `${getScorePercent(dim.score, dim.max)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`tag ${dim.verdict.tagClass}`}>
                        {dim.verdict.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[0.813rem] text-muted-foreground max-w-xs leading-relaxed">{dim.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prompt Efficiency */}
        {evaluation.prompt_efficiency && (
          <div className="nudge-card mb-10 animate-fade-up delay-3">
            <h2 className="text-[1.063rem] font-bold text-foreground mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[var(--tag-blue-bg)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--tag-blue-text)]" />
              </span>
              Prompt Efficiency
            </h2>
            <div className="nudge-card__inset space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.875rem] text-muted-foreground">Total Tokens</span>
                <span className="font-mono font-bold text-foreground text-[1.063rem]">{evaluation.prompt_efficiency.total_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.875rem] text-muted-foreground">Redundancy</span>
                <span className={`tag ${
                  evaluation.prompt_efficiency.redundancy_flag === 'none' ? 'tag--green' :
                  evaluation.prompt_efficiency.redundancy_flag === 'low' ? 'tag--blue' :
                  evaluation.prompt_efficiency.redundancy_flag === 'moderate' ? 'tag--yellow' : 'tag--red'
                }`}>
                  {evaluation.prompt_efficiency.redundancy_flag}
                </span>
              </div>
              {evaluation.prompt_efficiency.compression_suggestion && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-[0.813rem] text-muted-foreground mb-2 font-medium">Compression Suggestion</p>
                  <p className="text-[0.875rem] text-foreground italic leading-relaxed">{evaluation.prompt_efficiency.compression_suggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="flex flex-wrap items-center gap-4 animate-fade-up delay-4">
          <Link href={`/session/new?from=${sessionId}`} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            View All Sessions
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={copyScoreSummary}
            className="ml-auto flex items-center gap-2 text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
      </main>
    </div>
  )
}
