'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
  className?: string
  value?: string
  storageKey?: string
  variant?: 'default' | 'minimal'
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Başlıq, məzmun və ya xülasə ilə axtarın...",
  onSearch,
  onClear,
  className = "",
  value,
  storageKey,
  variant = 'default'
}) => {
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      return localStorage.getItem(storageKey) || value || ''
    }
    return value || ''
  })

  useEffect(() => {
    if (value !== undefined && !storageKey) {
      setQuery(value)
    }
  }, [value, storageKey])

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, query)
    }
  }, [query, storageKey])

  const doSearch = useCallback(() => {
    onSearch(query)
  }, [query, onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleClear = () => {
    setQuery('')
    onClear?.()
    onSearch('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSearch()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`h-5 w-5 ${variant === 'minimal' ? 'text-slate-400' : 'text-blue-400'}`} aria-hidden="true" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`block w-full text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:outline-none ${
            variant === 'minimal'
              ? 'bg-transparent border-none ring-0 focus:ring-0 py-4 pl-12 pr-12 text-sm'
              : 'rounded-xl border border-blue-100 bg-white pl-10 pr-10 py-3 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
          }`}
          placeholder={placeholder}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-2 flex items-center px-3 text-slate-400 hover:text-blue-600 transition-colors"
          aria-label="Axtar"
        >
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

export default SearchBar
