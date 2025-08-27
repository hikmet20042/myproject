'use client'
import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
  className?: string
  debounceMs?: number
  value?: string
  storageKey?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search by title, content, or abstract...",
  onSearch,
  onClear,
  className = "",
  debounceMs = 300,
  value,
  storageKey
}) => {
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      return localStorage.getItem(storageKey) || value || ''
    }
    return value || ''
  })
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined && !storageKey) {
      setQuery(value)
    }
  }, [value, storageKey])

  // Save to localStorage when query changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, query)
    }
  }, [query, storageKey])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleClear = () => {
    setQuery('')
    setDebouncedQuery('')
    onClear?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
          placeholder={placeholder}
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

export default SearchBar