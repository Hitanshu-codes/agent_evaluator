"use client"

import Link from "next/link"
import { Check, ChevronDown, ArrowRight, Copy, Loader2 } from "lucide-react"
import { useState } from "react"

const dimensions = [
  { name: "Agent Identity Clarity", score: 9, max: 11, percent: 82, color: "yellow", note: "Role is defined but tone and persona are vague." },
  { name: "Structural Completeness", score: 12, max: 12, percent: 100, color: "green", note: "All three layers present: job, always-do, never-do." },
  { name: "Instruction Precision", score: 8, max: 12, percent: 67, color: "yellow", note: "IF/THEN used but SAY clauses are missing from most rules." },
  { name: "Few-Shot Examples", score: 5, max: 11, percent: 45, color: "red", note: "Only simple examples provided. Hard edge cases not covered." },
  { name: "Guardrails and Pressure Holding", score: 10, max: 12, percent: 83, color: "green", note: "Agent held position well under pushback in scenario 3." },
  { name: "Edge Case Coverage", score: 7, max: 11, percent: 64, color: "yellow", note: "Cancellation in transit edge case not anticipated." },
  { name: "PII and Data Discipline", score: 11, max: 11, percent: 100, color: "green", note: "No PII issues. Agent correctly refused credential requests." },
  { name: "Prompt Failure Anticipation", score: 5, max: 10, percent: 50, color: "red", note: "No fallback instruction defined for unresolvable situations." },
  { name: "Eval Readiness", score: 7, max: 10, percent: 70, color: "yellow", note: "Most instructions testable but two rules are too vague." },
]

const strengths = [
  "Clear structural layers — job, rules, guardrails all present.",
  "Strong PII discipline — agent never requested restricted data.",
  "Good pressure handling — agent held position in 2 of 3 pushback tests.",
]

const improvements = [
  "Add SAY clauses to every IF/THEN rule so the agent has exact language to use.",
  "Add at least two examples for hard edge cases — a return outside the window and an EMI double-deduction scenario.",
  "Define a fallback — if the agent cannot resolve in two exchanges it must offer escalation to a senior agent.",
]

function getBarColor(color: string) {
  if (color === "green") return "bg-green-600"
  if (color === "yellow") return "bg-yellow-500"
  return "bg-red-500"
}

export default function ScorePage() {
  const [flagsOpen, setFlagsOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1">
          <span className="font-mono font-bold text-xl tracking-tight text-foreground">nudgeable</span>
          <span className="w-2 h-2 rounded-full bg-primary" />
        </Link>
        <div className="flex items-center gap-6">
          <Link 
            href="/session/new"
            className="bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
          >
            New Session
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Logout
          </Link>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 py-10 pb-24">
        {/* Loading State Reference */}
        <div className="mb-16 pb-16 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-6 text-center">Loading State Reference</p>
          <div className="flex flex-col items-center">
            <div className="w-[130px] h-[130px] rounded-full border-6 border-border bg-card flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            </div>
            <p className="mt-4 font-medium text-foreground">Evaluating your prompt</p>
            <p className="text-sm text-muted-foreground">This usually takes 10 to 15 seconds</p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="flex flex-col items-center mb-12">
          <div 
            className="w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center"
            style={{ 
              border: "6px solid #1E7E34",
              backgroundColor: "rgba(30, 126, 52, 0.08)"
            }}
          >
            <span className="font-mono font-bold text-[42px] leading-none text-foreground">74</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <p className="mt-4 font-bold text-foreground">Attempt 2 — Flipkart Customer Resolution Agent</p>
          <p className="text-sm text-muted-foreground">Evaluated on 28 Jan 2025 · 6 exchanges</p>
        </div>

        {/* Score Breakdown */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">Score Breakdown</h2>
          <div className="space-y-5">
            {dimensions.map((dim) => (
              <div key={dim.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{dim.name}</span>
                  <span className="font-mono font-bold text-foreground">{dim.score}/{dim.max}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
                  <div 
                    className={`h-full ${getBarColor(dim.color)} rounded-full transition-all`}
                    style={{ width: `${dim.percent}%` }}
                  />
                </div>
                <p className="text-sm italic text-muted-foreground">{dim.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">Strengths and Improvements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* What Worked */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700">What Worked</span>
              </div>
              <div className="space-y-3">
                {strengths.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg text-sm text-green-800"
                    style={{ backgroundColor: "rgba(30, 126, 52, 0.1)" }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Improve Next Time */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-700">Improve Next Time</span>
              </div>
              <div className="space-y-3">
                {improvements.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-card border-l-4 border-yellow-500 text-sm text-foreground"
                  >
                    <span className="font-semibold">{idx + 1}.</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Flags Collapsible */}
        <div className="mb-12">
          <button 
            onClick={() => setFlagsOpen(!flagsOpen)}
            className="flex items-center gap-2 text-foreground font-semibold mb-4 hover:opacity-80 transition-opacity"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${flagsOpen ? "" : "-rotate-90"}`} />
            Phase 1 Validation Flags
          </button>
          {flagsOpen && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">V-05</span> — No guardrail section found — impacted score by approximately 2 points.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/session/new"
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="border-2 border-foreground text-foreground font-semibold px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
          >
            View All Sessions
          </Link>
          <button className="ml-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-4 h-4" />
            Copy Score Summary
          </button>
        </div>
      </main>
    </div>
  )
}
