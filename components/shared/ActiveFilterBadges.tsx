'use client';

import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface FilterBadge { /** Unique identifier for the filter */
  id: string;
  /** Filter label (e.g., "Type") */
  label: string;
  /** Filter value display text */
  value: string;
  /** Callback when badge is removed */
  onRemove: () => void;
  /** Color scheme for the badge */
  colorScheme?: 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'teal' | 'amber' | 'orange'; }

interface ActiveFilterBadgesProps { /** Array of active filter badges to display */
  badges: FilterBadge[];
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Whether to show the clear all button */
  showClearAll?: boolean; }

const colorSchemes = {
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', hover: 'hover:text-green-900 hover:bg-green-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:text-blue-900 hover:bg-blue-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:text-indigo-900 hover:bg-indigo-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:text-purple-900 hover:bg-purple-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', hover: 'hover:text-pink-900 hover:bg-pink-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', hover: 'hover:text-teal-900 hover:bg-teal-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', hover: 'hover:text-amber-900 hover:bg-amber-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:text-orange-900 hover:bg-orange-200' },
};

/**
 * Displays active filter badges with remove functionality
 */
export function ActiveFilterBadges({ badges,
  onClearAll,
  showClearAll = true, }: ActiveFilterBadgesProps) {

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Filter className="w-4 h-4 text-blue-600" />
        {'Aktiv filtrlər'}:
      </span>
      
      {badges.map((badge) => { const colors = colorSchemes[badge.colorScheme || 'blue'];
        return (
          <span
            key={badge.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} text-sm font-medium border ${colors.border} shadow-sm`}
          >
            {badge.label}: {badge.value}
            <Button variant="ghost" size="xs" className={`p-0.5 ${colors.hover} rounded-full transition-colors`} onClick={badge.onRemove} aria-label={`${badge.label} filtrini sil`} icon={X} />
          </span>
        ); })}

      {showClearAll && badges.length > 1 && (
        <div className="ml-auto">
          <Button variant="outline" size="xs" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border-2 border-blue-200 text-slate-700 hover:bg-slate-100 hover:border-blue-300 font-medium transition-all duration-300" onClick={onClearAll} icon={X}>Hamısını təmizlə</Button>
        </div>
      )}
    </div>
  ); }
