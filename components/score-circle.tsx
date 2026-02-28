interface ScoreCircleProps {
  score: number
}

export function ScoreCircle({ score }: ScoreCircleProps) {
  // Green for >= 70, Yellow for 50-69, otherwise gray
  const borderColor = score >= 70 
    ? 'border-green-500' 
    : score >= 50 
      ? 'border-yellow-500' 
      : 'border-gray-300'

  return (
    <div 
      className={`w-14 h-14 rounded-full border-4 ${borderColor} flex items-center justify-center`}
    >
      <span className="text-lg font-bold text-foreground">{score}</span>
    </div>
  )
}
