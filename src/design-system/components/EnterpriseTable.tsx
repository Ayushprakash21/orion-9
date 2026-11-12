import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface EnterpriseTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  title?: string;
  searchPlaceholder?: string;
  searchableKey?: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  exportable?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function EnterpriseTable<T extends { id?: string | number }>({
  columns,
  data,
  title,
  searchPlaceholder = 'Filter records...',
  searchableKey,
  pageSize = 10,
  onRowClick,
  actions,
  exportable = false,
  emptyMessage = 'No operational records found.',
  className,
}: EnterpriseTableProps<T>) {
  const { isDark } = useOrionTheme();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((row) => {
      if (searchableKey) {
        return searchableKey(row).toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(term)
      );
    });
  }, [data, search, searchableKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      const valA = col?.accessor ? col.accessor(a) : (a as any)[sortKey];
      const valB = col?.accessor ? col.accessor(b) : (b as any)[sortKey];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      const res = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? res : -res;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div
      className={cn(
        'rounded-md border flex flex-col overflow-hidden text-xs',
        isDark
          ? 'bg-[#161b22] border-[#30363d]'
          : 'bg-white border-[#d0d7de] shadow-xs',
        className
      )}
    >
      {/* Table Header / Toolbar */}
      {(title || searchPlaceholder || actions) && (
        <div
          className={cn(
            'px-3.5 py-2.5 border-b flex items-center justify-between gap-3 shrink-0',
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
          )}
        >
          <div className="flex items-center gap-2">
            {title && (
              <span
                className={cn(
                  'font-semibold text-xs tracking-tight uppercase',
                  isDark ? 'text-white' : 'text-[#1f2328]'
                )}
              >
                {title}
              </span>
            )}
            <span
              className={cn(
                'font-mono text-[11px] px-1.5 py-0.5 rounded-sm border',
                isDark
                  ? 'bg-white/5 border-white/10 text-white/60'
                  : 'bg-black/5 border-black/10 text-black/60'
              )}
            >
              {sortedData.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                className={cn(
                  'w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2',
                  isDark ? 'text-white/40' : 'text-black/40'
                )}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className={cn(
                  'pl-8 pr-2.5 py-1 text-xs rounded-sm border focus:outline-none focus:ring-1 focus:ring-sky-500 w-44 sm:w-56',
                  isDark
                    ? 'bg-[#161b22] border-[#30363d] text-white placeholder-white/30'
                    : 'bg-white border-[#d0d7de] text-[#1f2328] placeholder-black/30'
                )}
              />
            </div>
            {actions}
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead
            className={cn(
              'border-b sticky top-0 z-10 text-[11px] uppercase tracking-wider',
              isDark
                ? 'bg-[#0d1117] border-[#30363d] text-white/60'
                : 'bg-[#f6f8fa] border-[#d0d7de] text-[#57606a]'
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={cn(
                    'py-2 px-3 font-semibold select-none',
                    col.sortable && 'cursor-pointer hover:text-sky-400 transition-colors',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'right' && 'justify-end w-full',
                      col.align === 'center' && 'justify-center w-full'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-white/30">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-sky-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-sky-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={cn(
              'divide-y',
              isDark ? 'divide-[#21262d]' : 'divide-[#eaeef2]'
            )}
          >
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(
                    'py-8 text-center text-xs font-mono',
                    isDark ? 'text-white/40' : 'text-black/40'
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={(row as any).id ?? idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer',
                    isDark
                      ? 'hover:bg-white/[0.03] text-white/90'
                      : 'hover:bg-black/[0.02] text-[#1f2328]'
                  )}
                >
                  {columns.map((col) => {
                    const rawVal = col.accessor
                      ? col.accessor(row)
                      : (row as any)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'py-2 px-3 align-middle',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center'
                        )}
                      >
                        {col.render ? col.render(rawVal, row) : String(rawVal ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          className={cn(
            'px-3.5 py-2 border-t flex items-center justify-between text-[11px] font-mono shrink-0',
            isDark
              ? 'bg-[#0d1117] border-[#30363d] text-white/50'
              : 'bg-[#f6f8fa] border-[#d0d7de] text-[#57606a]'
          )}
        >
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(
                'px-2 py-0.5 rounded-sm border transition-colors',
                currentPage <= 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-sky-500 cursor-pointer',
                isDark ? 'border-[#30363d] text-white' : 'border-[#d0d7de] text-black'
              )}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                'px-2 py-0.5 rounded-sm border transition-colors',
                currentPage >= totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-sky-500 cursor-pointer',
                isDark ? 'border-[#30363d] text-white' : 'border-[#d0d7de] text-black'
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
