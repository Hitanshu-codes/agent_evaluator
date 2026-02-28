export default function LoginPage() {
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
        <form className="space-y-4" suppressHydrationWarning>
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              suppressHydrationWarning
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-3 hover:bg-primary/90 transition-colors"
            suppressHydrationWarning
          >
            Sign In
          </button>
          
          {/* Error message - visible for design review */}
          <p className="text-destructive text-sm text-center">
            Invalid username or password
          </p>
        </form>
      </div>
    </main>
  )
}
