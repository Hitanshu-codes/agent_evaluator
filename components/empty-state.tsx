export function EmptyState() {
  return (
    <div className="bg-card border border-border p-8 text-center">
      <p className="text-muted-foreground mb-4">
        No sessions yet. Start your first session to begin building better AI agents.
      </p>
      <button className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors">
        Start Session
      </button>
    </div>
  )
}
