"use client"

import Link from 'next/link'
import { X, AlertTriangle, Info, Check } from 'lucide-react'

export default function NewSessionPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-mono text-xl font-medium text-foreground">
              Nudgeable
            </span>
            <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-foreground">Hello Riya</span>
            <Link 
              href="/session/new"
              className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              New Session
            </Link>
            <Link 
              href="/login" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[720px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">New Session</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Phase 1 of 3 — Define your agent
          </p>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full">
              Phase 1
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="px-4 py-1.5 border border-border text-muted-foreground text-sm rounded-full">
              Phase 2
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="px-4 py-1.5 border border-border text-muted-foreground text-sm rounded-full">
              Phase 3
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-8">
          {/* Field 1 - Problem Statement */}
          <div>
            <label className="block text-foreground font-bold mb-1">
              Problem Statement
            </label>
            <p className="text-muted-foreground text-sm mb-2">
              What is this AI agent being built to solve? Be specific — this becomes the title of your session.
            </p>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              defaultValue="Handle Flipkart customer complaints about returns, refunds, and delivery issues via live chat."
            />
          </div>

          {/* Field 2 - System Prompt */}
          <div>
            <label className="block text-foreground font-bold mb-1">
              System Prompt
            </label>
            <p className="text-muted-foreground text-sm mb-2">
              Define who the agent is, what it must always do, and what it must never do. This is the primary object being evaluated.
            </p>
            <textarea
              rows={10}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-[13px] leading-relaxed"
              defaultValue={`You are Klip, a Flipkart customer support agent. Your job is to help customers resolve issues with their orders, returns, refunds, and product complaints.

WHAT YOU MUST ALWAYS DO
- Greet the customer by their first name.
- Verify the order ID before taking any action.
- Offer a clear next step at the end of every response.

WHAT YOU MUST NEVER DO
- Never promise anything outside the policies provided.
- Never ask for financial credentials.
- Never share data about other customers.`}
            />
          </div>

          {/* Field 3 - Use-Case Context */}
          <div>
            <label className="block text-foreground font-bold mb-1">
              Use-Case Context and Data
            </label>
            <p className="text-muted-foreground text-sm mb-2">
              Paste order details, product data, and policies the agent needs for this simulation.
            </p>
            <textarea
              rows={7}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-[13px] leading-relaxed"
              defaultValue="CUSTOMER: Riya Sharma (CUS-10041) | Mumbai | Flipkart Plus: Yes — ORDER: FK-88291034 | boAt Rockerz 450 Headphones | Delivered 11 Jan 2025 — RETURN WINDOW: 7 days | Days since delivery: 3 | Amount: Rs 1,299 UPI"
            />
          </div>
        </form>

        {/* Validation Results */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Validation Results</h3>
          
          {/* Error card */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">V-03</span>
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                  ERROR — blocks simulation
                </span>
              </div>
              <p className="text-sm text-foreground">
                Your prompt references the user phone number. Remove all phone number references before continuing.
              </p>
            </div>
          </div>

          {/* Warning card */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-500">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">V-05</span>
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                  WARNING
                </span>
              </div>
              <p className="text-sm text-foreground">
                No must-never-do rules found. Add at least one guardrail. This will affect your score.
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">V-06</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
                  INFO
                </span>
              </div>
              <p className="text-sm text-foreground">
                Your use case mentions order data. Paste order details in the context field above.
              </p>
            </div>
          </div>

          {/* Success state */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Success State (Reference)</h4>
            <div className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">
                  Prompt validated successfully. No errors found.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            System prompt: 312 characters
          </span>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-medium px-6 py-2.5 hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Validate and Continue
          </button>
        </div>
      </div>

      {/* Success state bottom bar reference */}
      <div className="max-w-[720px] mx-auto px-6 mt-8 mb-8">
        <p className="text-sm text-muted-foreground mb-2">Success state button (reference):</p>
        <div className="bg-card border border-border p-4 flex items-center justify-end">
          <button
            type="button"
            className="bg-primary text-primary-foreground font-medium px-6 py-2.5 hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Continue to Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
