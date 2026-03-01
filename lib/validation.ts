export type ValidationLevel = 'ERROR' | 'WARNING' | 'INFO'

export interface ValidationFlag {
  id: string
  level: ValidationLevel
  message: string
}

interface SessionFields {
  system_prompt: string
  context_data: string | null
  compiled_prompt: string
}

const PII_PATTERNS = {
  phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
  creditCard: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/,
  aadhaar: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
}

const FINANCIAL_KEYWORDS = [
  'bank account',
  'account number',
  'routing number',
  'credit card',
  'debit card',
  'cvv',
  'pin number',
  'password',
  'otp',
  'one time password',
  'card details',
  'card number',
  'expiry date',
  'security code',
]

export function runValidationChecks(session: SessionFields): ValidationFlag[] {
  const flags: ValidationFlag[] = []
  const systemPrompt = session.system_prompt.toLowerCase()
  
  // Validate system prompt only (exclude context_data)
  const promptsToValidate = session.system_prompt

  // V-01: Check for phone number patterns in system/use-case prompts only
  if (PII_PATTERNS.phone.test(promptsToValidate)) {
    flags.push({
      id: 'V-01',
      level: 'ERROR',
      message: 'Your prompt contains what appears to be a phone number. Remove all phone number references before continuing.'
    })
  }

  // V-02: Check for email addresses in system/use-case prompts only
  if (PII_PATTERNS.email.test(promptsToValidate)) {
    flags.push({
      id: 'V-02',
      level: 'ERROR',
      message: 'Your prompt contains an email address. Remove email addresses or use placeholder text like [EMAIL] instead.'
    })
  }

  // V-03: Check for credit card or financial account patterns in system/use-case prompts only
  if (PII_PATTERNS.creditCard.test(promptsToValidate) || PII_PATTERNS.aadhaar.test(promptsToValidate)) {
    flags.push({
      id: 'V-03',
      level: 'ERROR',
      message: 'Your prompt contains what appears to be a financial account number. Remove all sensitive numbers before continuing.'
    })
  }

  // V-04: Check for requests to collect financial credentials in system prompt
  const hasFinancialRequest = FINANCIAL_KEYWORDS.some(keyword => systemPrompt.includes(keyword))
  if (hasFinancialRequest && (systemPrompt.includes('ask for') || systemPrompt.includes('collect') || systemPrompt.includes('request'))) {
    flags.push({
      id: 'V-04',
      level: 'ERROR',
      message: 'Your system prompt instructs the agent to collect sensitive financial information. This is not allowed.'
    })
  }

  // V-05: Check for must-never-do / guardrail section
  const hasGuardrails = 
    systemPrompt.includes('never') || 
    systemPrompt.includes('must not') || 
    systemPrompt.includes('do not') ||
    systemPrompt.includes('don\'t') ||
    systemPrompt.includes('prohibited') ||
    systemPrompt.includes('forbidden')
  
  if (!hasGuardrails) {
    flags.push({
      id: 'V-05',
      level: 'WARNING',
      message: 'No guardrail rules found (e.g., "never", "must not", "do not"). Add at least one guardrail to improve your score.'
    })
  }

  // V-06: Check for must-always-do rules
  const hasAlwaysRules = 
    systemPrompt.includes('always') || 
    systemPrompt.includes('must') ||
    systemPrompt.includes('should') ||
    systemPrompt.includes('required')
  
  if (!hasAlwaysRules) {
    flags.push({
      id: 'V-06',
      level: 'WARNING',
      message: 'No positive instructions found (e.g., "always", "must"). Add clear directives for what the agent should do.'
    })
  }

  // V-07: Check if context data is provided when system prompt mentions data-related keywords
  const mentionsData = 
    systemPrompt.includes('order') || 
    systemPrompt.includes('customer') || 
    systemPrompt.includes('product') ||
    systemPrompt.includes('account') ||
    systemPrompt.includes('data')
  
  if (mentionsData && !session.context_data) {
    flags.push({
      id: 'V-07',
      level: 'INFO',
      message: 'Your system prompt mentions data (orders, customers, etc.). Consider adding context data for a more realistic simulation.'
    })
  }

  // V-08: Check system prompt length - too short may lack detail
  if (session.system_prompt.length < 100) {
    flags.push({
      id: 'V-08',
      level: 'INFO',
      message: 'Your system prompt is quite short. Consider adding more detail about the agent\'s role, tone, and specific behaviors.'
    })
  }

  return flags
}

export function hasErrorFlags(flags: ValidationFlag[]): boolean {
  return flags.some(flag => flag.level === 'ERROR')
}
