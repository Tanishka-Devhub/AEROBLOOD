import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key?: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string | number);
  keyExtractor?: (row: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  keyField,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data to display.',
  emptyMessage,
  searchable = false,
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const getKey = (row: T, idx: number): string | number => {
    if (keyExtractor) return keyExtractor(row);
    if (typeof keyField === 'function') return keyField(row);
    if (keyField) return String(row[keyField]);
    return idx;
  };

  const getColKey = (col: Column<T>, cIdx: number): string => {
    return col.key || `col-${col.header}-${cIdx}`;
  };

  const renderCell = (col: Column<T>, row: T): React.ReactNode => {
    if (col.render) return col.render(row);
    if (col.accessor) return col.accessor(row);
    if (col.key) return String((row as Record<string, unknown>)[col.key] ?? '');
    return null;
  };

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, searchQuery.trim()));
    }
    // Default search across all properties
    return data.filter((row) =>
      Object.values(row as Record<string, unknown>).some((val) =>
        String(val ?? '').toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    );
  }, [data, searchable, searchQuery, searchFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const displayEmptyTitle = emptyMessage || emptyTitle;
  const displayEmptyDesc = emptyMessage ? '' : emptyDescription;

  return (
    <div className={`w-full overflow-hidden rounded-lg border border-border bg-secondary shadow-sm ${className}`}>
      {/* Optional Search Bar */}
      {searchable && (
        <div className="p-3.5 border-b border-border flex items-center justify-between gap-4 bg-secondary/60">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{filteredData.length}</span> records
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState className="border-0 rounded-none py-12" />
      ) : filteredData.length === 0 ? (
        <EmptyState title={displayEmptyTitle} description={displayEmptyDesc} className="border-0 rounded-none py-12" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-background text-[11px] font-bold uppercase tracking-normalr text-muted-foreground border-b border-border">
                <tr>
                  {columns.map((col, cIdx) => (
                    <th key={getColKey(col, cIdx)} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80 font-normal">
                {paginatedData.map((row, idx) => (
                  <tr key={getKey(row, idx)} className="hover:bg-secondary/40 transition-colors">
                    {columns.map((col, cIdx) => (
                      <td key={getColKey(col, cIdx)} className={`px-4 py-3 ${col.className || ''}`}>
                        {renderCell(col, row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-3 px-4 bg-background/60 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-border bg-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-border bg-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
