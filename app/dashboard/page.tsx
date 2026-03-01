"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { Sparkline } from '@/components/sparkline'
import { ScoreCircle } from '@/components/score-circle'

interface Attempt {
  attempt_number: number
  overall_score: number
  created_at: string
  session_id: string
}

interface UseCase {
  problem_statement: string
  attempts: Attempt[]
  last_updated: string
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

export default function DashboardPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('User')

  const totalSessions = useCases.reduce((sum, uc) => sum + uc.attempts.length, 0)
  const allScores = useCases.flatMap(uc => uc.attempts.map(a => a.overall_score))
  const personalBest = allScores.length > 0 ? Math.max(...allScores) : 0

  const lastThreeScores = allScores.slice(-3)
  const avgLastThree = lastThreeScores.length > 0
    ? (lastThreeScores.reduce((a, b) => a + b, 0) / lastThreeScores.length).toFixed(1)
    : '0'

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const progressRes = await fetch('/api/users/me/progress')

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setUseCases(progressData.useCases || [])
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasData = useCases.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <img src="/logo.png" alt="Nudgeable" className="h-12" />
            </Link>

            {useCases.length > 0 && (
              <Link
                href={`/history/${encodeURIComponent(useCases[0].problem_statement)}`}
                className="relative text-foreground hover:text-foreground/80 transition-colors font-medium"
              >
                History
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-primary"></span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-foreground">Hello {username}</span>
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

      {/* Welcome strip */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-primary-foreground">
            Welcome back{username !== 'User' ? `, ${username}` : ''}
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} completed · Personal best: {personalBest}/100
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stats Cards - Always visible */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
            </div>
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Personal Best</p>
              <p className="text-3xl font-bold text-foreground">
                {personalBest}<span className="text-lg font-normal text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg Score Last 3</p>
              <p className="text-3xl font-bold text-foreground">{avgLastThree}</p>
            </div>
          </div>
        </section>

        {!hasData ? (
          /* Empty State */
          <section>
            <div className="bg-card border border-border p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No sessions yet. Start your first session to begin building better AI agents.
              </p>
              <Link
                href="/session/new"
                className="inline-block bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
              >
                Start Session
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Active Use Cases */}
            {useCases.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Active Use Cases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {useCases.map((useCase, index) => {
                    const latestAttempt = useCase.attempts[useCase.attempts.length - 1]
                    const previousAttempt = useCase.attempts.length > 1
                      ? useCase.attempts[useCase.attempts.length - 2]
                      : null
                    const delta = previousAttempt
                      ? latestAttempt.overall_score - previousAttempt.overall_score
                      : 0
                    const sparklineData = useCase.attempts.map(a => a.overall_score)
                    const isFirstAttempt = useCase.attempts.length === 1

                    return (
                      <div key={index} className="bg-card border border-border p-6">
                        <h3 className="font-bold text-foreground text-lg mb-1">
                          {useCase.problem_statement.length > 50
                            ? useCase.problem_statement.substring(0, 50) + '...'
                            : useCase.problem_statement}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Last updated {getRelativeTime(useCase.last_updated)}
                        </p>

                        <div className="flex items-center gap-6 mb-4">
                          <Sparkline data={sparklineData} />
                          <ScoreCircle score={latestAttempt.overall_score} />
                          <div className="flex flex-col">
                            {!isFirstAttempt && delta !== 0 ? (
                              <span className={`text-sm font-medium flex items-center gap-1 ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {delta > 0 ? '+' : ''}{delta} from last attempt
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {isFirstAttempt ? 'First attempt' : 'No change'}
                              </span>
                            )}
                            <span className="text-muted-foreground text-sm">
                              Attempt {useCase.attempts.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link
                            href={`/session/new?from=${latestAttempt.session_id}`}
                            className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
                          >
                            Try Again
                          </Link>
                          <Link
                            href={`/history/${encodeURIComponent(useCase.problem_statement)}`}
                            className="border border-foreground text-foreground font-medium px-4 py-2 hover:bg-muted transition-colors"
                          >
                            View History
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
