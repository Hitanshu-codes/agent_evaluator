"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
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

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
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
      <div className="bg-card border border-border p-3 shadow-lg">
        <p className="font-bold text-foreground">{payload[0].payload.score}</p>
        <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !useCase) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center">
              <span className="font-mono text-xl font-medium text-foreground">Nudgeable</span>
              <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-card border border-border p-8 text-center">
            <p className="text-muted-foreground">{error || 'Use case not found'}</p>
            <Link href="/dashboard" className="text-primary underline mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const chartData = useCase.attempts.map(attempt => ({
    attempt: `Attempt ${attempt.attempt_number}`,
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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center">
              <span className="font-mono text-xl font-medium text-foreground">
                Nudgeable
              </span>
              <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
            </Link>
            
            <Link 
              href={`/history/${encodeURIComponent(useCase.problem_statement)}`}
              className="relative text-foreground hover:text-foreground/80 transition-colors font-medium"
            >
              History
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-primary"></span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/session/new"
              className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              New Session
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{useCase.problem_statement}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {useCase.attempts.length} attempt{useCase.attempts.length !== 1 ? 's' : ''} · Best score: {bestAttempt.overall_score} · Started {firstAttemptDate}
          </p>
        </div>

        {/* Score trend chart */}
        <div className="bg-card border border-border p-6">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="attempt" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888880', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888880', fontSize: 12 }}
              />
              <ReferenceLine 
                y={70} 
                stroke="#888880" 
                strokeDasharray="5 5"
                label={{ value: 'Target', position: 'right', fill: '#888880', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#F5C518" 
                strokeWidth={2.5}
                dot={{ fill: '#1A1A1A', r: 5, strokeWidth: 0 }}
                activeDot={{ fill: '#1A1A1A', r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Personal Best card */}
        <div className="bg-primary p-4">
          <p className="text-primary-foreground">
            <span className="font-bold">Personal Best</span> — {bestAttempt.overall_score} out of 100 on Attempt {bestAttempt.attempt_number} · {formatDate(bestAttempt.created_at)}
          </p>
        </div>

        {/* Session table */}
        <div className="bg-card border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Attempt</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Score</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Lowest Dimension</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {useCase.attempts.map((attempt) => (
                <tr key={attempt.session_id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm text-foreground">Attempt {attempt.attempt_number}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(attempt.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getScoreBadgeColor(attempt.overall_score)}`}>
                      {attempt.overall_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {getLowestDimension(attempt.dimension_scores)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Complete</td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/session/${attempt.session_id}/score`}
                      className="text-sm text-foreground underline hover:no-underline"
                    >
                      View Score Card
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Try Again Button */}
        <div>
          <Link
            href={`/session/new?from=${useCase.attempts[useCase.attempts.length - 1].session_id}`}
            className="inline-block bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </main>
    </div>
  )
}
