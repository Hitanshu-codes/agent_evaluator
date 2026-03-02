"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
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
      className={className || "flex items-center gap-2 text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors font-medium"}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </>
      )}
    </button>
  )
}
