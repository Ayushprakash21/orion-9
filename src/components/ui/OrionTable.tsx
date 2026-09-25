import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

export interface OrionTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onRowClick?: (row: T) => void;
  compact?: boolean;
  striped?: boolean;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function OrionTable<T>({
  data,
  columns,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  compact = false,
  striped = false,
  loading = false,
  emptyText = 'No records found',
  className,
}: OrionTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-os-border bg-os-surface shadow-xs', className)}>
      <table className="w-full text-left border-collapse text-os-text-primary text-xs sm:text-sm select-text">
        <thead>
          <tr className="border-b border-os-border bg-os-surface-secondary/90 font-semibold text-os-text-muted uppercase tracking-wider text-[11px]">
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 font-semibold transition-colors',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer hover:text-os-text-primary select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className={cn('flex items-center gap-1.5', col.align === 'center' && 'justify-center', col.align === 'right' && 'justify-end')}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-os-text-muted">
                        {isSorted ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-os-accent" /> : <ChevronDown className="w-3.5 h-3.5 text-os-accent" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-os-border/60">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-os-text-muted">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-os-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-os-text-muted text-xs font-medium">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = keyExtractor(row, rowIndex);
              const isEven = rowIndex % 2 === 0;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors font-mono-data text-xs',
                    striped && !isEven ? 'bg-os-surface-secondary/40' : 'bg-os-surface',
                    onRowClick ? 'cursor-pointer hover:bg-os-surface-hover/80 active:bg-os-surface-active/60' : 'hover:bg-os-surface-hover/40'
                  )}
                >
                  {columns.map((col) => {
                    const value = col.accessor ? col.accessor(row) : (row as any)[col.key];
                    return (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn(
                          compact ? 'px-3 py-2' : 'px-4 py-3',
                          'text-os-text-primary whitespace-nowrap',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
