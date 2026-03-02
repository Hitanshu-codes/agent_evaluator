interface ScoreCircleProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreCircle({ score, size = 'md' }: ScoreCircleProps) {
  const borderColor = score >= 70 
    ? 'var(--success)' 
    : score >= 50 
      ? 'var(--warning)' 
      : 'var(--destructive)'
      
  const bgColor = score >= 70 
    ? 'var(--tag-green-bg)' 
    : score >= 50 
      ? 'var(--tag-yellow-bg)' 
      : 'var(--tag-red-bg)'

  const sizeClasses = {
    sm: 'w-10 h-10 text-[0.875rem] border-[3px]',
    md: 'w-14 h-14 text-[1.125rem] border-4',
    lg: 'w-20 h-20 text-[1.5rem] border-[5px]'
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-foreground`}
      style={{ 
        borderColor: borderColor,
        backgroundColor: bgColor
      }}
    >
      {score}
    </div>
  )
}
