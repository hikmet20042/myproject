'use client'
import React, { useState } from 'react';
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
    container: 'border-b border-gray-200',
    tab: 'px-4 py-2 font-medium text-sm border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300',
    activeTab: 'border-blue-500 text-blue-600'
  },
  pills: {
    container: 'bg-gray-100 p-1 rounded-lg',
    tab: 'px-4 py-2 font-medium text-sm rounded-md hover:bg-gray-200',
    activeTab: 'bg-white text-gray-900 shadow-sm'
  },
  underline: {
    container: '',
    tab: 'px-4 py-2 font-medium text-sm border-b-2 border-transparent hover:text-gray-700',
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
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const activeTab = controlledActiveTab || internalActiveTab;
  const variantStyles = tabVariants[variant];

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className={cn('flex space-x-1', variantStyles.container, tabsClassName)}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
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
              {tab.badge && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTabContent && (
        <div className={cn('mt-4', contentClassName)}>
          {activeTabContent}
        </div>
      )}
    </div>
  );
};

export default Tabs;