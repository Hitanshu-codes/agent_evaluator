import Link from 'next/link'
import { UseCaseCard } from '@/components/use-case-card'
import { InProgressCard } from '@/components/in-progress-card'
import { EmptyState } from '@/components/empty-state'
import { LogoutButton } from '@/components/logout-button'

export default function DashboardPage() {
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

      {/* Welcome strip */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-primary-foreground">
            Welcome back, Riya
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            4 sessions completed · Personal best: 83/100
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Active Use Cases */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Active Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UseCaseCard
              title="Flipkart Customer Resolution Agent"
              lastUpdated="2 hours ago"
              sparklineData={[42, 55, 61, 74, 83]}
              score={83}
              delta={9}
              attempt={5}
              maxAttempts={8}
            />
            <UseCaseCard
              title="Returns and Escalation Agent"
              lastUpdated="yesterday"
              sparklineData={[38, 51, 60]}
              score={60}
              attempt={3}
              maxAttempts={8}
              isFirstAttempt={true}
            />
          </div>
          <div className="mt-6">
            <UseCaseCard
              title="Voice IVR Agent — Inbound Calls"
              lastUpdated="just now"
              sparklineData={[38]}
              score={38}
              attempt={1}
              maxAttempts={8}
              isFirstAttempt={true}
            />
          </div>
        </section>

        {/* Stats Row */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-foreground">8</p>
            </div>
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Personal Best</p>
              <p className="text-3xl font-bold text-foreground">83<span className="text-lg font-normal text-muted-foreground">/100</span></p>
            </div>
            <div className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg Score Last 3</p>
              <p className="text-3xl font-bold text-foreground">72.7</p>
            </div>
          </div>
        </section>

        {/* In Progress */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">In Progress</h2>
          <InProgressCard
            title="Flipkart Returns Agent — Attempt 2"
            phases={[
              { label: 'Phase 1', status: 'completed' },
              { label: 'Phase 2', status: 'active' },
              { label: 'Phase 3', status: 'pending' },
            ]}
          />
        </section>

        {/* Empty State Reference */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Empty State (Reference)</h2>
          <EmptyState />
        </section>
      </main>
    </div>
  )
}
