'use client'
import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
  onNavigate?: (item: DropdownItem) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = 'right',
  className,
  dropdownClassName,
  disabled = false,
  onNavigate,
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          className={cn(
            'flex items-center space-x-1',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {trigger}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={position === 'left' ? 'start' : 'end'}
          sideOffset={8}
          className={cn(
            'z-50 min-w-[12rem] rounded-xl border border-blue-100 bg-white py-1 shadow-md',
            dropdownClassName
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <DropdownMenu.Separator
                  key={index}
                  className="my-1 h-px bg-blue-100"
                />
              )
            }

            const ItemIcon = item.icon

            return (
              <DropdownMenu.Item
                key={index}
                disabled={item.disabled}
                onSelect={(event) => {
                  event.preventDefault()
                  if (item.disabled) return
                  if (item.onClick) item.onClick()
                  if (item.href || onNavigate) {
                    onNavigate?.(item)
                  }
                }}
                className={cn(
                  'flex w-full cursor-pointer select-none items-center space-x-2 rounded-md px-4 py-2 text-left text-sm text-slate-700 outline-none focus:bg-blue-50 focus:text-blue-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
                )}
              >
                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                <span>{item.label}</span>
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
};

export default Dropdown;