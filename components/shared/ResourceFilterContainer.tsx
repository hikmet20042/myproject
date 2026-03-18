'use client';

import { useState, ReactNode } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface ResourceFilterContainerProps { /** Title displayed in the filter header */
  title: string;
  /** Subtitle/description displayed in the filter header */
  subtitle?: string;
  /** Icon component to display in header (default: Filter) */
  icon?: React.ComponentType<{ className?: string }>;
  /** The search input element - always visible */
  searchInput: ReactNode;
  /** Additional filter controls (selects, checkboxes, etc.) - collapsible */
  filterControls?: ReactNode;
  /** Active filter badges to display */
  activeFilters?: ReactNode;
  /** Whether filters start expanded on mobile */
  defaultExpanded?: boolean;
  /** Gradient colors for the icon background */
  iconGradient?: string;
  /** Border color */
  borderColor?: string; }

/**
 * Standardized filter container for resource pages.
 * Shows search input by default, with collapsible section for additional filters.
 */
export function ResourceFilterContainer({ title,
  subtitle,
  icon: Icon = Filter,
  searchInput,
  filterControls,
  activeFilters,
  defaultExpanded = false,
  iconGradient = 'from-blue-600 to-emerald-600',
  borderColor = 'border-blue-100', }: ResourceFilterContainerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasAdditionalFilters = !!filterControls;

  return (
    <div className={`bg-white rounded-2xl shadow-md border-2 ${borderColor} p-6 sm:p-8 backdrop-blur-sm animate-fade-in`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {hasAdditionalFilters && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-100 hover:border-blue-200 hover:bg-slate-50 transition-all duration-200 text-sm font-medium text-gray-700"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Filtrləri Gizlət' : 'Daha Çox Filtr'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">{'Filtrləri Gizlət'}</span>
              </>
            ) : (
              <>
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{'Daha Çox Filtr'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Search Input - Always Visible */}
      <div className="mb-4">
        {searchInput}
      </div>

      {/* Additional Filters - Collapsible */}
      {hasAdditionalFilters && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${ isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0' }`}
        >
          <div className="pt-2 border-t border-blue-100">
            {filterControls}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters && (
        <div className="mt-6">
          {activeFilters}
        </div>
      )}
    </div>
  ); }
