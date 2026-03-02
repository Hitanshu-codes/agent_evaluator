"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Loader2, ChevronLeft, Trophy, TrendingUp, Calendar, RefreshCw, Eye, Plus } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

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

const DIMENSION_LABELS: Record<string, string> = {
  agent_identity_clarity: "Agent Identity Clarity",
  structural_completeness: "Structural Completeness",
  instruction_precision: "Instruction Precision",
  few_shot_examples: "Few-Shot Examples",
  guardrails_pressure_holding: "Guardrails & Pressure Holding",
  edge_case_coverage: "Edge Case Coverage",
  pii_data_discipline: "PII & Data Discipline",
  prompt_failure_anticipation: "Prompt Failure Anticipation",
  eval_readiness: "Eval Readiness"
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getScoreTagClass(score: number): string {
  if (score >= 70) return 'tag--green'
  if (score >= 50) return 'tag--yellow'
  return 'tag--red'
}

function getLowestDimension(dimensionScores: Record<string, { score: number; max: number; note: string }> | null): string {
  if (!dimensionScores) return 'N/A'
  
  let lowestKey = ''
  let lowestRatio = 1

  for (const [key, value] of Object.entries(dimensionScores)) {
    const ratio = value.score / value.max
    if (ratio < lowestRatio) {
      lowestRatio = ratio
      lowestKey = key
    }
  }

  return DIMENSION_LABELS[lowestKey] || lowestKey || 'N/A'
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { score: number; date: string } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="nudge-card p-3 shadow-[var(--shadow-lg)]">
        <p className="font-bold text-foreground text-[1.25rem]">{payload[0].payload.score}</p>
        <p className="text-[0.75rem] text-muted-foreground">{payload[0].payload.date}</p>
      </div>
    )
  }
  return null
}

export default function HistoryPage() {
  const params = useParams()
  const problemStatement = decodeURIComponent(params.id as string)
  
  const [useCase, setUseCase] = useState<UseCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/users/me/progress')
        if (!response.ok) {
          throw new Error('Failed to fetch progress')
        }
        
        const data = await response.json()
        const found = (data.useCases || []).find(
          (uc: UseCase) => uc.problem_statement === problemStatement
        )
        
        if (found) {
          setUseCase(found)
        } else {
          setError('Use case not found')
        }
      } catch (err) {
        console.error('Error fetching history:', err)
        setError('Failed to load history data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [problemStatement])

  if (isLoading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !useCase) {
    return (
      <div className="page-bg">
        <header className="navbar">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-10" />
          </Link>
        </header>
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="nudge-card text-center py-12">
            <p className="text-muted-foreground mb-4">{error || 'Use case not found'}</p>
            <Link href="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const chartData = useCase.attempts.map(attempt => ({
    attempt: `#${attempt.attempt_number}`,
    score: attempt.overall_score,
    date: formatDate(attempt.created_at)
  }))

  const bestAttempt = useCase.attempts.reduce((best, current) => 
    current.overall_score > best.overall_score ? current : best
  , useCase.attempts[0])

  const firstAttemptDate = useCase.attempts.length > 0 
    ? formatDate(useCase.attempts[0].created_at)
    : 'N/A'

  return (
    <div className="page-bg pb-16">
      {/* Navbar */}
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
          
          <span className="text-[0.875rem] font-medium text-foreground ml-2">History</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/session/new" className="btn-primary py-2 px-5">
            <Plus className="w-4 h-4" />
            New Session
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        {/* Heading */}
        <div className="animate-fade-up">
          <h1 className="text-[1.875rem] font-bold text-foreground leading-snug">{useCase.problem_statement}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="tag tag--blue">
              {useCase.attempts.length} attempt{useCase.attempts.length !== 1 ? 's' : ''}
            </span>
            <span className="tag tag--yellow">
              Best: {bestAttempt.overall_score}
            </span>
            <span className="text-[0.813rem] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Started {firstAttemptDate}
            </span>
          </div>
        </div>

        {/* Score trend chart */}
        <div className="nudge-card animate-fade-up delay-1">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground text-[1.063rem]">Score Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="attempt" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A8090', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A8090', fontSize: 12 }}
              />
              <ReferenceLine 
                y={70} 
                stroke="#23CE6B" 
                strokeDasharray="5 5"
                label={{ value: 'Target: 70', position: 'right', fill: '#0A6632', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#FFCE00" 
                strokeWidth={3}
                dot={{ fill: '#221D23', r: 6, strokeWidth: 3, stroke: '#FFCE00' }}
                activeDot={{ fill: '#FFCE00', r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Personal Best card */}
        <div 
          className="p-5 rounded-[var(--radius-xl)] animate-fade-up delay-2"
          style={{ background: 'var(--primary)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-[#221D23]" />
            </div>
            <div>
              <p className="text-[0.75rem] text-[#221D23]/70 uppercase tracking-wider font-semibold">Personal Best</p>
              <p className="text-[#221D23]">
                <span className="font-bold text-[1.5rem]">{bestAttempt.overall_score}</span>
                <span className="text-[0.875rem]">/100</span>
                <span className="text-[0.875rem] ml-2">on Attempt {bestAttempt.attempt_number} · {formatDate(bestAttempt.created_at)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Session table */}
        <div className="nudge-card overflow-hidden p-0 animate-fade-up delay-3">
          <table className="w-full">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Attempt</th>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Lowest Dimension</th>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-[0.70rem] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {useCase.attempts.map((attempt) => (
                <tr key={attempt.session_id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                  <td className="px-6 py-4 text-[0.875rem] font-semibold text-foreground">#{attempt.attempt_number}</td>
                  <td className="px-6 py-4 text-[0.875rem] text-muted-foreground">{formatDate(attempt.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`tag ${getScoreTagClass(attempt.overall_score)}`}>
                      {attempt.overall_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[0.813rem] text-muted-foreground">
                    {getLowestDimension(attempt.dimension_scores)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="tag tag--green">Complete</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/session/${attempt.session_id}/score`}
                      className="inline-flex items-center gap-1.5 text-[0.813rem] font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Score
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Try Again Button */}
        <div className="animate-fade-up delay-4">
          <Link
            href={`/session/new?from=${useCase.attempts[useCase.attempts.length - 1].session_id}`}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>
        </div>
      </main>
    </div>
  )
}
