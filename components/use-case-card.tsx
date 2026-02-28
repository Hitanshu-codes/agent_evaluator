import { ArrowUp } from 'lucide-react'
import { Sparkline } from './sparkline'
import { ScoreCircle } from './score-circle'

interface UseCaseCardProps {
  title: string
  lastUpdated: string
  sparklineData: number[]
  score: number
  delta?: number
  attempt: number
  maxAttempts: number
  isFirstAttempt?: boolean
}

export function UseCaseCard({
  title,
  lastUpdated,
  sparklineData,
  score,
  delta,
  attempt,
  maxAttempts,
  isFirstAttempt = false,
}: UseCaseCardProps) {
  return (
    <div className="bg-card border border-border p-6">
      {/* Header */}
      <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">Last updated {lastUpdated}</p>
      
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4">
        <Sparkline data={sparklineData} />
        <ScoreCircle score={score} />
        <div className="flex flex-col">
          {!isFirstAttempt && delta !== undefined ? (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              +{delta} from last attempt
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">First attempt</span>
          )}
          <span className="text-muted-foreground text-sm">
            Attempt {attempt} of {maxAttempts}
          </span>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3">
        <button className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors">
          Continue
        </button>
        <button className="border border-foreground text-foreground font-medium px-4 py-2 hover:bg-muted transition-colors">
          View History
        </button>
      </div>
    </div>
  )
}
