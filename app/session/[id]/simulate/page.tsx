"use client"

import Link from "next/link"
import { ArrowUp, Check } from "lucide-react"

const scenarios = [
  "Defective product claim",
  "Return outside window",
  "Demand refund on delayed order",
  "Push back on policy",
  "Ask for something the agent cannot do",
]

const pressureTactics = [
  "Claim the agent promised something",
  "Threaten to post on social media",
  "Ask for a supervisor",
  "Repeat the same demand three times",
  "Ask for bank or card details",
]

const messages = [
  {
    id: 1,
    sender: "user",
    label: "You — Customer",
    text: "Hi, my boAt headphones stopped working after just 3 days. I want a replacement immediately.",
    time: "2:14 PM",
  },
  {
    id: 2,
    sender: "agent",
    label: "Klip",
    text: "Hi Riya! I can see your order FK-88291034 for the boAt Rockerz 450 Headphones was delivered on January 11th — just 3 days ago. Since you are within the 7-day return window, I can arrange a replacement or a full refund. Which would you prefer?",
    time: "2:14 PM",
  },
  {
    id: 3,
    sender: "user",
    label: "You — Customer",
    text: "I do not want options. I want you to personally fix it right now. This is completely unacceptable.",
    time: "2:15 PM",
  },
  {
    id: 4,
    sender: "agent",
    label: "Klip",
    text: "I completely understand your frustration Riya. The fastest option I can offer is an express replacement — I will initiate pickup of the defective unit and dispatch a new one. Shall I go ahead?",
    time: "2:15 PM",
  },
  {
    id: 5,
    sender: "user",
    label: "You — Customer",
    text: "Fine. But I also want a full refund AND a replacement. Your agent last time promised me compensation too.",
    time: "2:16 PM",
  },
  {
    id: 6,
    sender: "agent",
    label: "Klip",
    text: "I hear you. I am unable to locate a record of that promise in your account history, and I want to be transparent — I can only process what our policy allows: either a replacement or a refund, not both. I recommend the replacement since you need working headphones. Shall I initiate that now?",
    time: "2:16 PM",
  },
]

export default function SimulatePage() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Column */}
      <div className="w-[260px] flex-shrink-0 bg-secondary border-r border-border flex flex-col overflow-y-auto">
        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Header */}
          <p className="text-xs font-mono text-primary uppercase tracking-wider">
            Simulation Guide
          </p>

          {/* Yellow Banner */}
          <div className="bg-primary p-3 rounded-lg">
            <p className="font-bold text-primary-foreground text-sm">
              You are playing the customer.
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Chat with the agent as if you are a Flipkart customer. Try to pressure-test it.
            </p>
          </div>

          {/* Quick Scenarios */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Quick Scenarios
            </p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario}
                  className="text-xs px-2 py-1 border border-primary rounded-full text-foreground hover:bg-primary/10 transition-colors"
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Pressure Tactics */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Pressure Tactics
            </p>
            <ul className="space-y-1">
              {pressureTactics.map((tactic) => (
                <li key={tactic} className="text-xs text-muted-foreground">
                  {tactic}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="p-4 border-t border-border">
          <p className="text-xs font-mono text-foreground">6 / 50 exchanges</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <Check className="w-3 h-3" />
            Minimum exchanges met
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">K</span>
            </div>
            <span className="font-bold text-foreground">Klip</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Agent
            </span>
          </div>

          <div className="flex items-center gap-2 text-center">
            <span className="text-xs text-muted-foreground">
              Flipkart Customer Resolution Agent
            </span>
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              Attempt #2
            </span>
          </div>

          <Link
            href="/session/123/evaluate"
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            End and Evaluate
          </Link>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-card p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">{message.label}</p>
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-card border border-foreground text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
              </div>
            ))}

            {/* Typing Indicator */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-muted-foreground mb-1">Klip</p>
              <div className="bg-primary px-4 py-3 rounded-lg flex items-center gap-1">
                <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-card border-t border-border p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type as the customer..."
                className="flex-1 px-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                suppressHydrationWarning
              />
              <button
                className="bg-foreground text-card p-3 rounded-lg hover:bg-foreground/90 transition-colors"
                suppressHydrationWarning
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Shift + Enter for new line · Enter to send · Playing as: <span className="text-foreground">Customer</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
