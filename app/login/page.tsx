"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
    <main className="page-bg flex items-center justify-center p-4">
      {/* Login card */}
      <div className="w-full max-w-[420px] nudge-card animate-pop">
        {/* Icon badge */}
        <div className="w-[72px] h-[72px] rounded-full bg-[rgba(255,206,0,0.15)] border-2 border-[rgba(255,206,0,0.3)] flex items-center justify-center mx-auto mb-5">
          <span className="text-[32px]">🚀</span>
        </div>
        
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/logo.png" alt="Nudgeable" className="h-14" />
        </div>
        
        {/* Subtitle */}
        <p className="text-center text-muted-foreground text-[0.938rem] mb-8">
          Flipkart Prompt Lab
        </p>
        
        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-[0.813rem] font-semibold text-[#4A4047]">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-[0.813rem] font-semibold text-[#4A4047]">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
          
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--tag-red-bg)] border border-[rgba(237,69,81,0.2)]">
              <p className="text-[var(--tag-red-text)] text-[0.813rem] text-center font-medium">
                {error}
              </p>
            </div>
          )}
        </form>
        
        {/* Footer text */}
        <p className="text-center text-muted-foreground text-[0.70rem] mt-6">
          Build better AI agents with confidence
        </p>
      </div>
    </main>
  )
}
