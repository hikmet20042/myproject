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
        <span className="text-sm font-semibold text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-semibold text-pink-600">
          {percentage}% Complete
        </span>
      </div>
      <div className="h-2 bg-white/80 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          {percentage === 100 && (
            <div className="w-full h-full animate-gradient-x bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600"></div>
          )}
        </div>
      </div>
    </div>
  )
}
