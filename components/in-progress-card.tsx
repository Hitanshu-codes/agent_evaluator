import { Check, ArrowRight } from 'lucide-react'

interface Phase {
  label: string
  status: 'completed' | 'active' | 'pending'
}

interface InProgressCardProps {
  title: string
  phases: Phase[]
}

export function InProgressCard({ title, phases }: InProgressCardProps) {
  return (
    <div className="bg-card border border-border border-l-4 border-l-amber-500 p-6">
      <h3 className="font-bold text-foreground text-lg mb-4">{title}</h3>
      
      {/* Phase pills */}
      <div className="flex gap-2 mb-4">
        {phases.map((phase, index) => (
          <div
            key={index}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
              phase.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : phase.status === 'active'
                  ? 'bg-primary/20 text-primary-foreground'
                  : 'bg-gray-100 text-muted-foreground'
            }`}
          >
            {phase.status === 'completed' && <Check className="w-3 h-3" />}
            {phase.status === 'active' && <ArrowRight className="w-3 h-3" />}
            {phase.label}
          </div>
        ))}
      </div>
      
      <button className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors">
        Resume
      </button>
    </div>
  )
}
