"use client"

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { X, Loader2, Upload, FileSpreadsheet, Trash2 } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

interface ValidationFlag {
  id: string
  level: 'ERROR' | 'WARNING' | 'INFO'
  message: string
}

interface SheetSummary {
  name: string
  rowCount: number
  columns: string[]
}

interface UploadedFile {
  fileName: string
  sheets: SheetSummary[]
  formattedContext: string
}

function NewSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [problemStatement, setProblemStatement] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [useCasePrompt, setUseCasePrompt] = useState('')
  const [contextData, setContextData] = useState('')
  
  const [flags, setFlags] = useState<ValidationFlag[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [hasValidated, setHasValidated] = useState(false)
  const [hasErrors, setHasErrors] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fromSessionId = searchParams.get('from')
    if (fromSessionId) {
      loadPreviousSession(fromSessionId)
    } else {
      setProblemStatement('Handle Flipkart customer complaints about returns, refunds, and delivery issues via live chat.')
      setSystemPrompt(`You are Klip, a Flipkart customer support agent. Your job is to help customers resolve issues with their orders, returns, refunds, and product complaints.

WHAT YOU MUST ALWAYS DO
- Greet the customer by their first name.
- Verify the order ID before taking any action.
- Offer a clear next step at the end of every response.

WHAT YOU MUST NEVER DO
- Never promise anything outside the policies provided.
- Never ask for financial credentials.
- Never share data about other customers.`)
      setContextData('CUSTOMER: Riya Sharma (CUS-10041) | Mumbai | Flipkart Plus: Yes — ORDER: FK-88291034 | boAt Rockerz 450 Headphones | Delivered 11 Jan 2025 — RETURN WINDOW: 7 days | Days since delivery: 3 | Amount: Rs 1,299 UPI')
    }
  }, [searchParams])

  async function loadPreviousSession(id: string) {
    try {
      const response = await fetch(`/api/sessions/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProblemStatement(data.problem_statement || '')
        setSystemPrompt(data.system_prompt || '')
        setUseCasePrompt(data.use_case_prompt || '')
        setContextData(data.context_data || '')
      }
    } catch (error) {
      console.error('Failed to load previous session:', error)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      const data = await response.json()
      setUploadedFile({
        fileName: data.fileName,
        sheets: data.sheets,
        formattedContext: data.formattedContext
      })

      setContextData(prev => {
        if (prev.trim()) {
          return prev + '\n\n' + data.formattedContext
        }
        return data.formattedContext
      })
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleRemoveFile() {
    if (uploadedFile) {
      setContextData(prev => prev.replace(uploadedFile.formattedContext, '').trim())
      setUploadedFile(null)
    }
  }

  async function handleContinue() {
    setIsValidating(true)
    setFlags([])
    setHasValidated(false)
    
    try {
      const createResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_statement: problemStatement,
          system_prompt: systemPrompt,
          use_case_prompt: useCasePrompt,
          context_data: contextData
        })
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(error.error || 'Failed to create session')
      }

      const { session_id } = await createResponse.json()
      setSessionId(session_id)

      router.push(`/session/${session_id}/simulate`)
    } catch (error) {
      console.error('Error creating session:', error)
      setFlags([{
        id: 'SYS-01',
        level: 'ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }])
      setHasErrors(true)
      setHasValidated(true)
    } finally {
      setIsValidating(false)
    }
  }

  const errorFlags = flags.filter(f => f.level === 'ERROR')

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <span className="font-mono text-xl font-medium text-foreground">
              Nudgeable
            </span>
            <span className="w-2 h-2 rounded-full bg-primary ml-1"></span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/session/new"
              className="bg-primary text-primary-foreground font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              New Session
            </Link>
            <LogoutButton />
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
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
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
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              disabled={isValidating}
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
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isValidating}
            />
          </div>

          {/* Field 3 - Use-Case Prompt (optional) */}
          <div>
            <label className="block text-foreground font-bold mb-1">
              Use-Case Prompt <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <p className="text-muted-foreground text-sm mb-2">
              Describe the specific scenario or use case for this simulation.
            </p>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-[13px] leading-relaxed"
              value={useCasePrompt}
              onChange={(e) => setUseCasePrompt(e.target.value)}
              placeholder="e.g., Customer wants to return a defective product..."
              disabled={isValidating}
            />
          </div>

          {/* Field 4 - Use-Case Context */}
          <div>
            <label className="block text-foreground font-bold mb-1">
              Use-Case Context and Data
            </label>
            <p className="text-muted-foreground text-sm mb-2">
              Paste order details, product data, and policies the agent needs for this simulation.
              Or upload an Excel file with multiple sheets (customer, product, seller data).
            </p>
            
            {/* Excel Upload Section */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isValidating || isUploading}
              />
              
              {!uploadedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isValidating || isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Excel File (.xlsx, .xls)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="border border-border bg-card/50 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-foreground">{uploadedFile.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {uploadedFile.sheets.map((sheet) => (
                      <div key={sheet.name} className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-medium rounded">
                          {sheet.name}
                        </span>
                        <span className="text-muted-foreground">
                          {sheet.rowCount} rows • {sheet.columns.length} columns
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Data has been formatted and added to context below
                  </p>
                </div>
              )}
              
              {uploadError && (
                <p className="text-sm text-red-500 mt-2">{uploadError}</p>
              )}
            </div>
            
            <textarea
              rows={10}
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-[13px] leading-relaxed"
              value={contextData}
              onChange={(e) => setContextData(e.target.value)}
              disabled={isValidating}
              placeholder="Customer data, product info, policies, etc. will appear here after upload..."
            />
          </div>
        </form>

        {/* Error Display */}
        {hasValidated && hasErrors && (
          <div className="mt-12 space-y-4">
            {errorFlags.map((flag) => (
              <div key={flag.id} className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500">
                <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {flag.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            System prompt: {systemPrompt.length} characters
          </span>
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={isValidating || !problemStatement.trim() || !systemPrompt.trim()}
            className="bg-primary text-primary-foreground font-medium px-6 py-2.5 hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              'Continue to Simulation'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewSessionContent />
    </Suspense>
  )
}
