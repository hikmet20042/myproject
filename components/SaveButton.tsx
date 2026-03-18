'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth/client'
import { Bookmark } from 'lucide-react'
import { Button } from './ui/Button'

interface SaveButtonProps { itemId: string
  itemType: 'event' | 'vacancy'
  itemTitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean }

export default function SaveButton({ itemId,
  itemType,
  itemTitle = '',
  className = '',
  size = 'sm',
  showText = true }: SaveButtonProps) { const { data: session, status } = useSession()
  const itemTypeLabel = itemType === 'event' ? 'tədbiri' : 'vakansiyanı'
  const isAuthLoading = status === 'loading'
  const [hasSaved, setHasSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch save status
  useEffect(() => { if (!session?.user?.id) return

    const fetchSaveStatus = async () => { try { const endpoint = itemType === 'event' 
          ? `/api/events/${itemId}/save`
          : `/api/vacancies/${itemId}/save`
        
        const response = await fetch(endpoint)
        if (response.ok) { const data = await response.json()
          setHasSaved(data.hasSaved) } } catch (error) { console.error('Error fetching save status:', error) } }

    fetchSaveStatus() }, [itemId, itemType, session])

  const handleSave = async () => { if (!session?.user?.id) { alert(`${itemTypeLabel} yadda saxlamaq üçün daxil olun`)
      return }

    if (isLoading) return

    setIsLoading(true)
    try { const endpoint = itemType === 'event'
        ? `/api/events/${itemId}/save`
        : `/api/vacancies/${itemId}/save`

      const response = await fetch(endpoint, { method: 'POST',
        headers: { 'Content-Type': 'application/json' } })

      if (response.ok) { const data = await response.json()
        setHasSaved(data.hasSaved)
        
        // Show success message
        const action = data.action === 'saved' ? 'saxlanıldı' : 'saxlanmışlardan silindi'
        const message = itemTitle 
          ? `"${itemTitle}" ${action}!`
          : `${itemTypeLabel} ${action}!`
        
        // You can replace this with a toast notification
        alert(message) } else { throw new Error('Failed to save') } } catch (error) { console.error('Error saving:', error)
      alert(`${itemTypeLabel} saxlamaq alınmadı. Yenidən cəhd edin.`) } finally { setIsLoading(false) } }

  if (isAuthLoading) { return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`inline-flex items-center gap-2 animate-pulse ${className}`}
      >
        <Bookmark className="w-4 h-4" />
        {showText && <span className="font-medium">{'Yüklənir'}</span>}
      </Button>
    ) }

  return (
    <Button
      onClick={handleSave}
      variant={hasSaved ? 'primary' : 'outline'}
      size={size}
      disabled={isLoading || !session?.user?.id}
      className={`inline-flex items-center gap-2 transition-all ${ hasSaved ? 'bg-blue-600 text-white' : 'hover:bg-blue-50' } ${className}`}
      title={ !session?.user?.id 
          ? `${itemTypeLabel} saxlamaq üçün daxil olun`
          : hasSaved 
            ? `Saxlanmış ${itemTypeLabel} siyahısından çıxar`
            : `Bu ${itemTypeLabel} saxla` }
    >
      <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
      {showText && (
        <span className="font-medium">
          {hasSaved ? 'Saxlanıldı' : 'Saxla'}
        </span>
      )}
    </Button>
  ) }
