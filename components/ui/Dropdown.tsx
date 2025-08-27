'use client'
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface DropdownItem {
  label: string;
  value?: string;
  href?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right';
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = 'right',
  className,
  dropdownClassName,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    
    if (item.href) {
      window.location.href = item.href;
    }
    
    setIsOpen(false);
  };

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center space-x-1',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {trigger}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200',
            position === 'left' ? 'left-0' : 'right-0',
            dropdownClassName
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <hr key={index} className="my-1 border-gray-200" />;
            }

            const ItemIcon = item.icon;

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2',
                  item.disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                )}
              >
                {ItemIcon && <ItemIcon className="w-4 h-4" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;