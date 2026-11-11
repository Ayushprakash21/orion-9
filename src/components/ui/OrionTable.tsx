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
    <div
      className={cn(
        'w-full overflow-x-auto rounded-[10px] border border-[var(--orion-border)] bg-[var(--orion-surface)] backdrop-blur-md shadow-[var(--orion-morph-shadow-soft)]',
        className
      )}
    >
      <table className="w-full text-left border-collapse text-[var(--orion-text-primary)] text-xs select-text">
        <thead>
          <tr className="border-b border-[var(--orion-border)] bg-[var(--orion-surface-elevated)] text-[var(--orion-text-muted)] text-[11px] font-medium tracking-tight">
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-3.5 py-2.5 font-medium transition-colors',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable &&
                      'cursor-pointer hover:text-[var(--orion-text-primary,#F2F2EF)] select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-[var(--orion-text-muted,#747875)]">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-[var(--orion-accent,#0071E3)]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[var(--orion-accent,#0071E3)]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--orion-border-subtle,var(--orion-border))]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--orion-text-muted,#747875)]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[var(--orion-accent,#0071E3)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[var(--orion-text-muted,#747875)] text-xs font-medium"
              >
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
                    'transition-colors text-xs',
                    striped && !isEven ? 'bg-[var(--orion-surface-hover)]/40' : 'bg-transparent',
                    onRowClick
                      ? 'cursor-pointer hover:bg-[var(--orion-surface-hover)] active:bg-[var(--orion-surface-active)]'
                      : 'hover:bg-[var(--orion-surface-hover)]/50'
                  )}
                >
                  {columns.map((col) => {
                    const value = col.accessor ? col.accessor(row) : (row as any)[col.key];
                    return (
                      <td
                        key={`${key}-${col.key}`}
                        className={cn(
                          compact ? 'px-3 py-1.5' : 'px-3.5 py-2.5',
                          'text-[var(--orion-text-primary,#F2F2EF)] whitespace-nowrap',
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
