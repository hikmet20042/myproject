import { Card } from '@/components/ui/Card'

/**
 * InfoCard Component
 * Small information cards with label and value
 * Used in: Profile, Dashboard, Detail pages
 */

interface InfoCardProps {
  label: string
  value: string | React.ReactNode
  hoverColor?: string
}

export default function InfoCard({ label, value, hoverColor = 'hover:border-blue-300' }: InfoCardProps) {
  return (
    <Card className={`group p-5 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 ${hoverColor} transition-all duration-300 hover:shadow-lg`}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="text-base font-semibold text-slate-900">
        {value}
      </div>
    </Card>
  )
}
