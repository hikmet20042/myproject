/**
 * ProgressIndicator Component
 * Shows step progress for multi-step forms
 * Used in: Submit Blog Step 1 & 2
 */

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  percentage: number
}

export default function ProgressIndicator({ currentStep, totalSteps, percentage }: ProgressIndicatorProps) {
  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-semibold text-blue-600">
          {percentage}% Complete
        </span>
      </div>
      <div className="h-2 bg-white/80 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          {percentage === 100 && (
            <div className="w-full h-full animate-gradient-x bg-gradient-to-r from-blue-500 via-cyan-600 to-emerald-600"></div>
          )}
        </div>
      </div>
    </div>
  )
}
