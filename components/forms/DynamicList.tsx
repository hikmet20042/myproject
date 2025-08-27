import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/Textarea';
import { Plus, X } from 'lucide-react';

export interface DynamicListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addButtonText?: string;
  minItems?: number;
  maxItems?: number;
  variant?: 'orange' | 'indigo' | 'purple' | 'default';
  className?: string;
}

const DynamicList = React.forwardRef<HTMLDivElement, DynamicListProps>(
  ({
    items,
    onChange,
    placeholder = 'Enter item...',
    addButtonText = 'Add Item',
    minItems = 1,
    maxItems = 10,
    variant = 'indigo',
    className,
    ...props
  }, ref) => {
    const handleItemChange = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      onChange(newItems);
    };
    
    const addItem = () => {
      if (items.length < maxItems) {
        onChange([...items, '']);
      }
    };
    
    const removeItem = (index: number) => {
      if (items.length > minItems) {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
      }
    };
    
    const numberColors = {
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      purple: 'bg-purple-100 text-purple-600',
      default: 'bg-gray-100 text-gray-600'
    };
    
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {items.map((item, index) => (
          <div key={index} className="group relative">
            <div className="flex items-start gap-4">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-2',
                numberColors[variant]
              )}>
                <span className="font-semibold text-sm">{index + 1}</span>
              </div>
              
              <div className="flex-1">
                <TextArea
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder}
                  variant={variant}
                  rows={2}
                  textAreaSize="lg"
                />
              </div>
              
              {items.length > minItems && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 mt-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {items.length < maxItems && (
          <Button
            type="button"
            variant="add"
            onClick={addItem}
            icon={Plus}
            fullWidth
            className="mt-6"
          >
            {addButtonText}
          </Button>
        )}
      </div>
    );
  }
);

DynamicList.displayName = 'DynamicList';

export { DynamicList };