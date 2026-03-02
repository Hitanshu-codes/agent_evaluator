"use client"

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { X, Loader2, Upload, FileSpreadsheet, Trash2, ArrowRight, ChevronLeft } from 'lucide-react'
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
    <div className="page-bg pb-28">
      {/* Navbar */}
      <header className="navbar">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="w-9 h-9 rounded-full border border-[var(--border-strong)] bg-white/80 flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A4047]" />
          </Link>
          <Link href="/dashboard">
            <img src="/logo.png" alt="Nudgeable" className="h-10" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <LogoutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[760px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-[1.875rem] font-bold text-foreground">New Session</h1>
          <p className="text-muted-foreground text-[0.938rem] mt-1">
            Phase 1 of 3 — Define your agent
          </p>
          
          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[0.813rem] font-bold text-primary-foreground">
                1
              </div>
              <span className="text-[0.875rem] font-semibold text-foreground">Define</span>
            </div>
            <div className="w-12 h-[2px] bg-[var(--border-strong)]" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] flex items-center justify-center text-[0.813rem] font-medium text-muted-foreground">
                2
              </div>
              <span className="text-[0.875rem] text-muted-foreground">Simulate</span>
            </div>
            <div className="w-12 h-[2px] bg-[var(--border-strong)]" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] flex items-center justify-center text-[0.813rem] font-medium text-muted-foreground">
                3
              </div>
              <span className="text-[0.875rem] text-muted-foreground">Evaluate</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-8 animate-fade-up delay-1" onSubmit={(e) => e.preventDefault()}>
          {/* Field 1 - Problem Statement */}
          <div className="nudge-card">
            <label className="block text-foreground font-bold text-[1.063rem] mb-1">
              Problem Statement
            </label>
            <p className="text-muted-foreground text-[0.875rem] mb-4">
              What is this AI agent being built to solve? Be specific — this becomes the title of your session.
            </p>
            <textarea
              rows={3}
              className="form-input resize-none font-sans"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              disabled={isValidating}
              placeholder="e.g., Handle customer complaints about returns..."
            />
          </div>

          {/* Field 2 - System Prompt */}
          <div className="nudge-card">
            <label className="block text-foreground font-bold text-[1.063rem] mb-1">
              System Prompt
            </label>
            <p className="text-muted-foreground text-[0.875rem] mb-4">
              Define who the agent is, what it must always do, and what it must never do. This is the primary object being evaluated.
            </p>
            <textarea
              rows={12}
              className="form-input resize-none font-mono text-[0.813rem] leading-relaxed"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isValidating}
              placeholder="You are..."
            />
          </div>

          {/* Field 3 - Context Data */}
          <div className="nudge-card">
            <label className="block text-foreground font-bold text-[1.063rem] mb-1">
              Use-Case Context and Data
            </label>
            <p className="text-muted-foreground text-[0.875rem] mb-4">
              Paste order details, product data, and policies the agent needs for this simulation.
              Or upload an Excel file with multiple sheets.
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
                  className="flex items-center gap-3 px-5 py-4 border-2 border-dashed border-[var(--border-strong)] rounded-[var(--radius-lg)] hover:border-primary hover:bg-[var(--muted)] transition-all text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">Upload Excel File (.xlsx, .xls)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="nudge-card__inset">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-[var(--tag-green-text)]" />
                      <span className="font-semibold text-foreground">{uploadedFile.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-muted-foreground hover:text-[var(--destructive)] transition-colors p-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {uploadedFile.sheets.map((sheet) => (
                      <div key={sheet.name} className="tag tag--green">
                        {sheet.name} · {sheet.rowCount} rows
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-[0.75rem] text-muted-foreground mt-3">
                    Data has been formatted and added to context below
                  </p>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--tag-red-bg)]">
                  <p className="text-[0.813rem] text-[var(--tag-red-text)] font-medium">{uploadError}</p>
                </div>
              )}
            </div>
            
            <textarea
              rows={10}
              className="form-input resize-none font-mono text-[0.813rem] leading-relaxed"
              value={contextData}
              onChange={(e) => setContextData(e.target.value)}
              disabled={isValidating}
              placeholder="Customer data, product info, policies, etc. will appear here after upload..."
            />
          </div>
        </form>

        {/* Error Display */}
        {hasValidated && hasErrors && (
          <div className="mt-8 space-y-4 animate-fade-up">
            {errorFlags.map((flag) => (
              <div key={flag.id} className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--tag-red-bg)] border-l-4 border-[var(--destructive)]">
                <X className="w-5 h-5 text-[var(--destructive)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[0.875rem] text-foreground font-medium">
                    {flag.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-filter backdrop-blur-lg border-t border-[var(--border)]">
        <div className="max-w-[760px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="tag tag--blue">
              {systemPrompt.length} chars
            </span>
            <span className="text-muted-foreground text-[0.813rem]">
              ~{Math.floor(systemPrompt.length / 4)} tokens
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={isValidating || !problemStatement.trim() || !systemPrompt.trim()}
            className="btn-primary"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              <>
                Continue to Simulation
                <ArrowRight className="w-4 h-4" />
              </>
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
      <div className="page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewSessionContent />
    </Suspense>
  )
}
