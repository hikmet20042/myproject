'use client'
import React, { useState } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

const tabVariants = {
  default: {
    container: 'border-b border-blue-100',
    tab: 'px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-200',
    activeTab: 'border-blue-500 text-blue-600'
  },
  pills: {
    container: 'rounded-xl border border-blue-100 bg-blue-50/70 p-1',
    tab: 'px-4 py-2 font-medium text-sm rounded-lg text-gray-600 hover:bg-white/80 hover:text-blue-700',
    activeTab: 'bg-white text-blue-700 shadow-sm border border-blue-100'
  },
  underline: {
    container: '',
    tab: 'px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-blue-700',
    activeTab: 'border-blue-500 text-blue-600'
  }
};

const tabSizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3'
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className,
  tabsClassName,
  contentClassName
}) => {
  const fallbackTab = defaultTab || tabs[0]?.id || ''
  const [internalActiveTab, setInternalActiveTab] = useState(fallbackTab);
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = controlledActiveTab || internalActiveTab;
  const variantStyles = tabVariants[variant];

  const handleTabChange = (tabId: string) => {
    if (onTabChange) onTabChange(tabId)
    if (!isControlled) setInternalActiveTab(tabId)
  }

  return (
    <RadixTabs.Root
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn('w-full', className)}
    >
      <RadixTabs.List className={cn('flex space-x-1', variantStyles.container, tabsClassName)}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <RadixTabs.Trigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className={cn(
                'flex items-center space-x-2 transition-colors duration-200',
                variantStyles.tab,
                tabSizes[size],
                isActive && variantStyles.activeTab,
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {TabIcon && (
                <TabIcon className={cn(
                  size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
                )} />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="ml-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                  {tab.badge}
                </span>
              )}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>

      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.id}
          value={tab.id}
          className={cn('mt-4', contentClassName)}
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};

export default Tabs;