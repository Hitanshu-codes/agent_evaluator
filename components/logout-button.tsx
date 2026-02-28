"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className = "text-muted-foreground hover:text-foreground transition-colors" }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
