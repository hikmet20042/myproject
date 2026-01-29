'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bookmark } from 'lucide-react'
import { Button } from './ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

interface SaveButtonProps {
  itemId: string
  itemType: 'event' | 'vacancy'
  itemTitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function SaveButton({
  itemId,
  itemType,
  itemTitle = '',
  className = '',
  size = 'sm',
  showText = true
}: SaveButtonProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [hasSaved, setHasSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch save status
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchSaveStatus = async () => {
      try {
        const endpoint = itemType === 'event' 
          ? `/api/events/${itemId}/save`
          : `/api/vacancies/${itemId}/save`
        
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setHasSaved(data.hasSaved)
        }
      } catch (error) {
        console.error('Error fetching save status:', error)
      }
    }

    fetchSaveStatus()
  }, [itemId, itemType, session])

  const handleSave = async () => {
    if (!session?.user?.id) {
      alert(t('save.pleaseSignInToSave', { type: itemType }))
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      const endpoint = itemType === 'event'
        ? `/api/events/${itemId}/save`
        : `/api/vacancies/${itemId}/save`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setHasSaved(data.hasSaved)
        
        // Show success message
        const action = data.action === 'saved' ? t('save.saved') : t('save.removed')
        const message = itemTitle 
          ? t('save.itemSavedWithTitle', { title: itemTitle, action })
          : t('save.itemSaved', { type: itemType, action })
        
        // You can replace this with a toast notification
        alert(message)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert(t('save.failedToSave', { type: itemType }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSave}
      variant={hasSaved ? 'primary' : 'outline'}
      size={size}
      disabled={isLoading || !session?.user?.id}
      className={`inline-flex items-center gap-2 transition-all ${
        hasSaved ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
      } ${className}`}
      title={
        !session?.user?.id 
          ? t('save.signInToSave', { type: itemType })
          : hasSaved 
            ? t('save.removeFromSaved', { type: itemType })
            : t('save.saveThis', { type: itemType })
      }
    >
      <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
      {showText && (
        <span className="font-medium">
          {hasSaved ? t('save.saved') : t('save.save')}
        </span>
      )}
    </Button>
  )
}
