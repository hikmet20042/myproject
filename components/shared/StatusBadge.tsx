/**
 * StatusBadge Component
 * Consistent status badges with icons across the application
 * Used in: Dashboard, Profile, Admin panels
 */

import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

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
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          label: text || 'Approved'
        }
      case 'rejected':
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          label: text || 'Rejected'
        }
      case 'pending':
      case 'warning':
        return {
          icon: Clock,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          label: text || 'Pending'
        }
      case 'inactive':
        return {
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          label: text || 'Inactive'
        }
      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          label: text || status
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-lg ${config.bgColor} ${config.textColor} font-semibold`}>
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
      {pulse && status === 'active' && (
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      )}
      <span className="capitalize">{config.label}</span>
    </span>
  )
}
