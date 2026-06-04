'use client';

import { useState, ReactNode } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ResourceFilterContainerProps {
  /** The search input element - always visible */
  searchInput: ReactNode;
  /** Additional filter controls (selects, checkboxes, etc.) - collapsible */
  filterControls?: ReactNode;
  /** Active filter badges to display */
  activeFilters?: ReactNode;
  /** Whether filters start expanded */
  defaultExpanded?: boolean;
}

/**
 * Modern and powerful filter container.
 * Combines search and a collapsible filter toggle button into one bar.
 */
export function ResourceFilterContainer({ 
  searchInput,
  filterControls,
  activeFilters,
  defaultExpanded = false,
}: ResourceFilterContainerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasAdditionalFilters = !!filterControls;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Main Bar: Search + Filter Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="rounded-full bg-white shadow-lg shadow-slate-200/30 border border-slate-200">
            {searchInput}
          </div>
        </div>
        
        {hasAdditionalFilters && (
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`shrink-0 gap-2 px-5 h-12 min-w-[120px] justify-center rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              isExpanded 
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isExpanded ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            {isExpanded ? 'Bağla' : 'Filtrlər'}
          </Button>
        )}
      </div>

      {/* Collapsible Panel */}
      {hasAdditionalFilters && (
        <div
          className={`transition-[opacity,transform] duration-300 ease-in-out ${
            isExpanded ? 'opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden'
          }`}
          style={{ maxHeight: isExpanded ? '1000px' : '0' }}
        >
          <Card className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/30">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50">
               <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Filter className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none">Ətraflı axtarış</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Nəticələri dəqiqləşdirin</p>
               </div>
            </div>
            {filterControls}
          </Card>
        </div>
      )}

      {/* Active Badges */}
      {activeFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {activeFilters}
        </div>
      )}
    </div>
  );
}
