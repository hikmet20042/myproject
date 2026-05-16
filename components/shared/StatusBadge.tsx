/**
 * StatusBadge Component
 * Consistent status badges with icons across the application
 * Used in: Dashboard, Profile, Admin panels
 */

import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

type StatusType = 'approved' | 'rejected' | 'pending' | 'active' | 'inactive' | 'success' | 'error' | 'warning'

interface StatusBadgeProps {
  status: StatusType
  text?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export default function StatusBadge({ 
  status, 
  text, 
  showIcon = true, 
  size = 'md',
  pulse = false
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
      case 'success':
      case 'active':
        return {
          icon: CheckCircle,
          variant: 'success' as const,
          iconColor: 'text-green-600',
          label: text || 'Təsdiqlənib'
        }
      case 'rejected':
      case 'error':
        return {
          icon: XCircle,
          variant: 'danger' as const,
          iconColor: 'text-red-600',
          label: text || 'Rədd edilib'
        }
      case 'pending':
      case 'warning':
        return {
          icon: Clock,
          variant: 'warning' as const,
          iconColor: 'text-amber-600',
          label: text || 'Gözləmədə'
        }
      case 'inactive':
        return {
          icon: AlertCircle,
          variant: 'secondary' as const,
          className: 'border-slate-200 bg-slate-100 text-slate-700',
          iconColor: 'text-slate-600',
          label: text || 'Aktiv deyil'
        }
      default:
        return {
          icon: AlertCircle,
          variant: 'secondary' as const,
          className: 'border-slate-200 bg-slate-100 text-slate-700',
          iconColor: 'text-slate-600',
          label: text || status
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <Badge variant={config.variant} size={size} rounded={false} className={`gap-1.5 font-semibold ${config.className || ''}`}>
      {showIcon && <Icon className={iconSizes[size] + ' ' + config.iconColor} />}
      {pulse && status === 'active' && (
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      )}
      <span className="capitalize">{config.label}</span>
    </Badge>
  )
}
