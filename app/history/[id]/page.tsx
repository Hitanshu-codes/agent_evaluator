"use client"

import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { LogoutButton } from '@/components/logout-button'

const chartData = [
  { attempt: 'Attempt 1', score: 42, date: '10 Jan 2025' },
  { attempt: 'Attempt 2', score: 55, date: '14 Jan 2025' },
  { attempt: 'Attempt 3', score: 61, date: '18 Jan 2025' },
  { attempt: 'Attempt 4', score: 74, date: '22 Jan 2025' },
  { attempt: 'Attempt 5', score: 83, date: '28 Jan 2025' },
]

const tableData = [
  { attempt: 1, date: '10 Jan 2025', score: 42, lowestDimension: 'Few-Shot Examples', status: 'Complete' },
  { attempt: 2, date: '14 Jan 2025', score: 55, lowestDimension: 'Structural Completeness', status: 'Complete' },
  { attempt: 3, date: '18 Jan 2025', score: 61, lowestDimension: 'Instruction Precision', status: 'Complete' },
  { attempt: 4, date: '22 Jan 2025', score: 74, lowestDimension: 'Prompt Failure Anticipation', status: 'Complete' },
  { attempt: 5, date: '28 Jan 2025', score: 83, lowestDimension: 'Eval Readiness', status: 'Complete' },
]

function getScoreBadgeColor(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-800'
  if (score >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
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
              href="/history/1" 
              className="relative text-foreground hover:text-foreground/80 transition-colors font-medium"
            >
              History
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-primary"></span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-foreground">Hello Riya</span>
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
          <h1 className="text-2xl font-bold text-foreground">Flipkart Customer Resolution Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">
            5 attempts · Best score: 83 · Started 10 Jan 2025
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
            <span className="font-bold">Personal Best</span> — 83 out of 100 on Attempt 5 · 28 Jan 2025
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
              {tableData.map((row) => (
                <tr key={row.attempt} className="border-t border-border">
                  <td className="px-4 py-3 text-sm text-foreground">Attempt {row.attempt}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getScoreBadgeColor(row.score)}`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.lowestDimension}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.status}</td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/session/${row.attempt}/score`}
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
      </main>
    </div>
  )
}
