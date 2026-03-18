'use client'

import Image from 'next/image'
import Link from 'next/link'

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
  transparent?: boolean
  onClick?: () => void
}

const logoDimensions = {
  sm: { width: 120, height: 65 },
  md: { width: 160, height: 87 },
  lg: { width: 220, height: 120 }
}

const logoSources = {
  sm: '/icma360_logo120x65.png',
  md: '/icma360_logo160x87.png',
  lg: '/icma360_logo220x120.png'
}

export default function Logo({
  className = '',
  size = 'md',
  showText = false,
  variant = 'light',
  href = '/',
  ariaLabel,
  textClassName = '',
  showTagline = true,
  taglineKey = 'footer.about',
  transparent = false,
  onClick
}: LogoProps) {
  const label = ariaLabel ?? 'Azərbaycanda Gənclərin və İcmaların İnkişafı'
  const tagline = taglineKey ? '' : ''

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const textStyles = {
    light: 'text-white',
    dark: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 bg-clip-text text-transparent',
    gradient: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 bg-clip-text text-transparent'
  }

  const { width: logoWidth, height: logoHeight } = logoDimensions[size]
  const logoSrc =
    transparent && size === 'md'
      ? '/icma360_logo160x87_transparent.png?v=1'
      : logoSources[size]

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 group ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <Image
          src={logoSrc}
          alt="icma360"
          width={logoWidth}
          height={logoHeight}
          className="h-auto w-auto"
          priority={size !== 'sm'}
          unoptimized
        />
      </div>

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
    gradient: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 bg-clip-text text-transparent'
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

export function LogoIcon({
  className = '',
  variant = 'light',
  href = '/',
  ariaLabel = 'icma360',
  onClick
}: { className?: string, variant?: 'light' | 'dark' | 'gradient', href?: string, ariaLabel?: string, onClick?: () => void }) {
  return (
    <Link
      href={href}
      className={`group ${className}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <Image
          src="/icma360_logo120x65.png"
          alt="icma360"
          width={120}
          height={65}
          className="h-auto w-auto"
          unoptimized
        />
      </div>
    </Link>
  )
}
