"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { adminConfig, AdminResourceKey } from "@/lib/admin-config";

export type AdminTableColumn<T> = {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type AdminTableProps<T extends { _id?: string; id?: string }> = {
  data: T[];
  columns: AdminTableColumn<T>[];
  emptyState?: ReactNode;
  rowKey?: (row: T, index: number) => string;
  rowClassName?: (row: T, index: number) => string;
  resource?: AdminResourceKey;
  currentRole?: string;
  actions?: Array<{
    key: string;
    show?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
    context?: (row: T) => Record<string, unknown>;
  }>;
  actionsHeader?: ReactNode;
  executeAction?: (
    resource: AdminResourceKey,
    actionKey: string,
    item: T,
    context?: Record<string, unknown>,
  ) => Promise<unknown>;
  isActionLoading?: (actionKey: string, item: T) => boolean;
};

export default function AdminTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  emptyState,
  rowKey,
  rowClassName,
  resource,
  currentRole,
  actions,
  actionsHeader,
  executeAction,
  isActionLoading,
}: AdminTableProps<T>) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {emptyState || (
          <p className="text-gray-500 text-center py-8">{"Məlumat tapılmadı"}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions && resource && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {actionsHeader || "Əməliyyatlar"}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : String(index)}
                className={cn(
                  "transition-colors hover:bg-gray-50",
                  rowClassName?.(row, index),
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-6 py-4 align-top", column.className)}
                  >
                    {column.render
                      ? column.render(row)
                      : (row as Record<string, ReactNode>)[column.key]}
                  </td>
                ))}
                {actions && resource && (
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-2 items-start">
                      {actions
                        .filter((action) => (action.show ? action.show(row) : true))
                        .filter((action) => {
                          const config = adminConfig[resource].actions[action.key];
                          if (!config) return false;
                          if (!config.roles || config.roles.length === 0) return true;
                          return config.roles.includes(currentRole || "");
                        })
                        .map((action) => {
                          const config = adminConfig[resource].actions[action.key];
                          if (!config) return null;
                          const actionLoading = isActionLoading
                            ? isActionLoading(action.key, row)
                            : false;
                          return (
                            <Button
                              key={action.key}
                              onClick={async () => {
                                if (!executeAction || !resource) return;
                                await executeAction(
                                  resource,
                                  action.key,
                                  row,
                                  action.context?.(row),
                                );
                              }}
                              variant={config.variant || "secondary"}
                              size="sm"
                              loading={actionLoading}
                              disabled={
                                (action.disabled ? action.disabled(row) : false) ||
                                actionLoading
                              }
                              className="inline-flex items-center"
                            >
                              {config.label}
                            </Button>
                          );
                        })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
