"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid username or password')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-card border border-border p-10">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <span className="font-mono text-2xl font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full">
            Nudgeable
          </span>
        </div>
        
        {/* Subtitle */}
        <p className="text-center text-muted-foreground text-sm mb-8">
          Flipkart Prompt Lab
        </p>
        
        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          {/* Error message */}
          {error && (
            <p className="text-destructive text-sm text-center">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
