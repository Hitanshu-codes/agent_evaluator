"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Loader2, Zap, Trophy, TrendingUp, Plus } from 'lucide-react'
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
      <div className="page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasData = useCases.length > 0

  return (
    <div className="page-bg">
      {/* Navbar */}
      <header className="navbar">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-10" />
          </Link>

          {useCases.length > 0 && (
            <Link
              href={`/history/${encodeURIComponent(useCases[0].problem_statement)}`}
              className="relative text-foreground hover:opacity-75 transition-opacity font-medium text-[0.938rem]"
            >
              History
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-primary"></span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#4A4047] text-[0.938rem]">Hello {username}</span>
          <Link href="/session/new" className="btn-primary py-2 px-5">
            <Plus className="w-4 h-4" />
            New Session
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Welcome banner */}
      <div className="relative overflow-hidden" style={{ background: 'var(--primary)' }}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-[1.875rem] font-bold text-[#221D23]">
            Welcome back{username !== 'User' ? `, ${username}` : ''}
          </h1>
          <p className="text-[#221D23]/70 text-[0.938rem] mt-1">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} completed · Personal best: {personalBest}/100
          </p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-[15%] w-[100px] h-[100px] rounded-full bg-white/10 translate-y-1/2" />
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* Stats Cards */}
        <section className="animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="nudge-card flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-[var(--tag-blue-bg)] flex items-center justify-center">
                <Zap className="w-6 h-6 text-[var(--tag-blue-text)]" />
              </div>
              <div>
                <p className="text-[0.813rem] text-muted-foreground mb-1">Total Sessions</p>
                <p className="text-[1.875rem] font-bold text-foreground leading-none">{totalSessions}</p>
              </div>
            </div>
            
            <div className="nudge-card flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-[var(--tag-yellow-bg)] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[var(--tag-yellow-text)]" />
              </div>
              <div>
                <p className="text-[0.813rem] text-muted-foreground mb-1">Personal Best</p>
                <p className="text-[1.875rem] font-bold text-foreground leading-none">
                  {personalBest}<span className="text-[1rem] font-normal text-muted-foreground">/100</span>
                </p>
              </div>
            </div>
            
            <div className="nudge-card flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-[var(--tag-green-bg)] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--tag-green-text)]" />
              </div>
              <div>
                <p className="text-[0.813rem] text-muted-foreground mb-1">Avg Score Last 3</p>
                <p className="text-[1.875rem] font-bold text-foreground leading-none">{avgLastThree}</p>
              </div>
            </div>
          </div>
        </section>

        {!hasData ? (
          /* Empty State */
          <section className="animate-fade-up delay-1">
            <div className="nudge-card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--tag-yellow-bg)] flex items-center justify-center mx-auto mb-4">
                <span className="text-[28px]">🎯</span>
              </div>
              <h3 className="text-[1.25rem] font-bold text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start your first session to begin building better AI agents with actionable feedback.
              </p>
              <Link href="/session/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                Start Your First Session
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Active Use Cases */}
            {useCases.length > 0 && (
              <section className="animate-fade-up delay-1">
                <h2 className="text-[1.25rem] font-bold text-foreground mb-5">Active Use Cases</h2>
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
                      <div 
                        key={index} 
                        className="nudge-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        style={{ borderLeft: '4px solid var(--primary)' }}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h3 className="font-bold text-foreground text-[1.063rem] leading-snug mb-1">
                              {useCase.problem_statement.length > 50
                                ? useCase.problem_statement.substring(0, 50) + '...'
                                : useCase.problem_statement}
                            </h3>
                            <p className="text-muted-foreground text-[0.813rem]">
                              Last updated {getRelativeTime(useCase.last_updated)}
                            </p>
                          </div>
                          <span className="tag tag--yellow">
                            Attempt {useCase.attempts.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 mb-5 p-4 rounded-[var(--radius-lg)] bg-[var(--secondary)]">
                          <Sparkline data={sparklineData} />
                          <ScoreCircle score={latestAttempt.overall_score} />
                          <div className="flex flex-col">
                            {!isFirstAttempt && delta !== 0 ? (
                              <span className={`text-[0.875rem] font-semibold flex items-center gap-1 ${delta > 0 ? 'text-[var(--tag-green-text)]' : 'text-[var(--tag-red-text)]'}`}>
                                {delta > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                                {delta > 0 ? '+' : ''}{delta} pts
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[0.875rem]">
                                {isFirstAttempt ? 'First attempt' : 'No change'}
                              </span>
                            )}
                            <span className="text-muted-foreground text-[0.813rem]">
                              from last attempt
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link
                            href={`/session/new?from=${latestAttempt.session_id}`}
                            className="btn-primary py-2 px-5"
                          >
                            Try Again
                          </Link>
                          <Link
                            href={`/history/${encodeURIComponent(useCase.problem_statement)}`}
                            className="btn-secondary py-2 px-5"
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
