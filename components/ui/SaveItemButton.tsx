import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SaveItemButtonProps {
  isSaved: boolean
  totalSaves: number
  isLoading: boolean
  isAuthLoading: boolean
  isAuthenticated: boolean
  itemTypeLabel: string
  itemTitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onToggle: () => void
}

export function SaveItemButton({
  isSaved,
  totalSaves,
  isLoading,
  isAuthLoading,
  isAuthenticated,
  itemTypeLabel,
  itemTitle = '',
  className = '',
  size = 'sm',
  showText = true,
  onToggle,
}: SaveItemButtonProps) {
  if (isAuthLoading) {
    return (
      <Button variant="outline" size={size} disabled className={`inline-flex items-center gap-2 animate-pulse ${className}`}>
        <Bookmark className="w-4 h-4" />
        {showText && <span className="font-medium">{'Yuklenir'}</span>}
      </Button>
    )
  }

  return (
    <Button
      onClick={onToggle}
      variant={isSaved ? 'primary' : 'outline'}
      size={size}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 transition-all ${isSaved ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'} ${className}`}
      title={
        !isAuthenticated
          ? `${itemTypeLabel} saxlamaq ucun daxil olun`
          : isSaved
            ? `Saxlanmis ${itemTypeLabel} siyahisindan cixar`
            : `Bu ${itemTypeLabel} saxla`
      }
      aria-label={itemTitle ? `${itemTitle} saxla` : 'Saxla'}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      {showText && <span className="font-medium">{isSaved ? 'Saxlanildi' : 'Saxla'} {totalSaves > 0 ? `(${totalSaves})` : ''}</span>}
      {!showText && totalSaves > 0 && <span className="text-xs font-semibold">({totalSaves})</span>}
    </Button>
  )
}
