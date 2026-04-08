"use client";

import { ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type AdminFiltersProps = {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function AdminFilters({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  actions,
  children,
  className,
}: AdminFiltersProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {onSearchChange && (
          <div className="flex-1">
            <Input
              value={searchValue || ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
