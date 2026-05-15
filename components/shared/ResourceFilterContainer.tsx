'use client';

import { useState, ReactNode } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

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
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-[2rem] blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-3 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-full p-2 pl-2 md:pl-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="flex-1 w-full">
            {searchInput}
          </div>
          
          {hasAdditionalFilters && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-sm transition-all whitespace-nowrap w-full md:w-auto ${
                isExpanded 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isExpanded ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
              {isExpanded ? 'Bağla' : 'Filtrlər'}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Panel */}
      {hasAdditionalFilters && (
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-8 shadow-lg shadow-slate-200/30">
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
          </div>
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
