'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'light' | 'dark' | 'gradient'
  href?: string
  ariaLabel?: string
  textClassName?: string
  showTagline?: boolean
  taglineKey?: string
  onClick?: () => void
}

export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  variant = 'light',
  href = '/',
  ariaLabel,
  textClassName = '',
  showTagline = true,
  taglineKey = 'footer.about',
  onClick
}: LogoProps) {
  const { t } = useLanguage()
  const label = ariaLabel ?? t('home.heroTitle')
  const tagline = taglineKey ? t(taglineKey) : ''
  
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  
  // Variant əsaslı rənglər
  const iconStyles = {
    light: 'bg-white text-blue-600',
    dark: 'bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 text-white',
    gradient: 'bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 text-white'
  }
  
  const textStyles = {
    light: 'text-white',
    dark: 'bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent',
    gradient: 'bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent'
  }
  
  return (
    <Link 
      href={href} 
      className={`flex items-center space-x-2 group ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      {/* İkon hissə - dairəvi 360 */}
      <div className={`relative flex items-center justify-center ${iconDimensions[size]}`}>
        {/* Xarici halqa */}
        <div className={`relative flex items-center justify-center ${iconDimensions[size]} rounded-full ${iconStyles[variant]} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
          <span className="font-bold text-xs tracking-tight">360</span>
        </div>
        
        {/* Hover effekti */}
        {variant === 'light' && (
          <div className={`absolute inset-0 bg-white rounded-full ${iconDimensions[size]} opacity-0 group-hover:opacity-20 blur-md transition-opacity`} />
        )}
      </div>
      
      {/* Mətn hissə */}
      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <span className={`font-bold ${sizeClasses[size]} ${textStyles[variant]}`}>
            icma360
          </span>
          {showTagline && taglineKey && (
            <span className={`text-[10px] ${variant === 'light' ? 'text-white/80' : 'text-gray-500'} -mt-1 tracking-wide`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

// Sadə variant - yalnız mətn
export function LogoText({
  className = '',
  variant = 'gradient',
  href = '/',
  ariaLabel = 'icma360',
  onClick
}: { className?: string, variant?: 'light' | 'dark' | 'gradient', href?: string, ariaLabel?: string, onClick?: () => void }) {
  const textStyles = {
    light: 'text-white',
    dark: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent'
  }
  
  return (
    <Link 
      href={href} 
      className={`font-bold text-2xl ${textStyles[variant]} hover:opacity-80 transition-opacity ${className}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      icma360
    </Link>
  )
}

// Kiçik variant - yalnız ikon
export function LogoIcon({
  className = '',
  variant = 'light',
  href = '/',
  ariaLabel = 'icma360',
  onClick
}: { className?: string, variant?: 'light' | 'dark' | 'gradient', href?: string, ariaLabel?: string, onClick?: () => void }) {
  const iconStyles = {
    light: 'bg-white text-blue-600',
    dark: 'bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 text-white',
    gradient: 'bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 text-white'
  }
  
  return (
    <Link 
      href={href} 
      className={`group ${className}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconStyles[variant]} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
          <span className="font-bold text-xs tracking-tight">360</span>
        </div>
      </div>
    </Link>
  )
}
