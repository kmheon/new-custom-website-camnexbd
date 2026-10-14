import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Download, SlidersHorizontal, CheckSquare, Square, RefreshCw, X, Filter
} from 'lucide-react';
import { Button, Badge } from '../../common/UI';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'outline' | 'secondary';
  action: (selectedRows: T[]) => Promise<void> | void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount?: number;
  idField?: keyof T | ((row: T) => string);
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (key: string, order: 'asc' | 'desc') => void;
  currentSort?: { key: string; order: 'asc' | 'desc' };
  bulkActions?: BulkAction<T>[];
  onExportCsv?: () => void;
  exportFileName?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  emptyState?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  totalCount,
  idField = 'id',
  searchPlaceholder = 'Search records...',
  searchQuery,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  page = 1,
  pageSize = 15,
  pageSizeOptions = [10, 15, 25, 50],
  onPageChange,
  onPageSizeChange,
  onSortChange,
  currentSort,
  bulkActions = [],
  onExportCsv,
  exportFileName = 'export.csv',
  isLoading = false,
  onRefresh,
  emptyState,
  title,
  subtitle,
  headerActions
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(columns.map(c => c.key)));
  const [columnChooserOpen, setColumnChooserOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState(searchQuery || '');

  const getId = useCallback((row: T): string => {
    if (typeof idField === 'function') return idField(row);
    return String(row[idField] ?? '');
  }, [idField]);

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(getId)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedRows = useMemo(() => {
    return data.filter(row => selectedIds.has(getId(row)));
  }, [data, selectedIds, getId]);

  const total = totalCount ?? data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(internalSearch);
  };

  const handleDefaultCsvExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    if (data.length === 0) return;
    const activeCols = columns.filter(c => visibleColumns.has(c.key));
    const headers = activeCols.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row => {
      return activeCols.map(c => {
        const val = row[c.key];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      {(title || headerActions) && (
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Control bar: search, filters, tools */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => {
              setInternalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24] transition-all"
          />
          {internalSearch && (
            <button
              type="button"
              onClick={() => {
                setInternalSearch('');
                if (onSearchChange) onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filters and Utilities */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterValues[filter.key] || ''}
              onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 focus:border-[#F15A24]"
            >
              <option value="">{filter.label}: All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Column Chooser */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnChooserOpen(!columnChooserOpen)}
              className="!py-1.5 !px-2.5 text-xs !border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Choose columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
            {columnChooserOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-2 text-xs">
                <div className="font-semibold text-slate-700 mb-2 px-1">Visible Columns</div>
                {columns.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(c.key)}
                      onChange={(e) => {
                        const next = new Set(visibleColumns);
                        if (e.target.checked) next.add(c.key);
                        else if (next.size > 1) next.delete(c.key);
                        setVisibleColumns(next);
                      }}
                      className="rounded text-[#F15A24] focus:ring-[#F15A24]"
                    />
                    <span className="text-slate-800">{c.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CSV Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDefaultCsvExport}
            className="!py-1.5 !px-2.5 text-xs !border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="!py-1.5 !px-2.5 text-xs !border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Refresh records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F15A24]' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk action banner when items selected */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="bg-orange-50/80 border-b border-orange-200/60 px-4 py-2 flex items-center justify-between text-xs text-orange-950 transition-all">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-[#F15A24] text-white px-2 py-0.5 rounded-full text-[10px]">
              {selectedIds.size}
            </span>
            <span>selected out of {total}</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions.map((ba, idx) => (
              <Button
                key={idx}
                variant={ba.variant || 'secondary'}
                size="sm"
                onClick={() => ba.action(selectedRows)}
                className="!py-1 !px-2.5 text-xs"
              >
                {ba.icon}
                {ba.label}
              </Button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-500 hover:text-slate-700 ml-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table content */}
      <div className="overflow-x-auto min-h-[220px]">
        {isLoading && data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F15A24]" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : data.length === 0 ? (
          emptyState || (
            <div className="p-12 text-center text-slate-400">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold text-slate-600">No records found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or search terms.</p>
            </div>
          )
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200 select-none">
              <tr>
                {bulkActions.length > 0 && (
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-[#F15A24]"
                    >
                      {selectedIds.size > 0 && selectedIds.size === data.length ? (
                        <CheckSquare className="w-4 h-4 text-[#F15A24]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                {columns.filter(c => visibleColumns.has(c.key)).map((col) => (
                  <th
                    key={col.key}
                    className={`p-3 ${col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => {
                      if (!col.sortable || !onSortChange) return;
                      const nextOrder = currentSort?.key === col.key && currentSort.order === 'asc' ? 'desc' : 'asc';
                      onSortChange(col.key, nextOrder);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        currentSort?.key === col.key ? (
                          currentSort.order === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-[#F15A24]" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[#F15A24]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const id = getId(row);
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-orange-50/30' : ''}`}
                  >
                    {bulkActions.length > 0 && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(id)}
                          className="text-slate-400 hover:text-[#F15A24]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#F15A24]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.filter(c => visibleColumns.has(c.key)).map((col) => (
                      <td key={col.key} className="p-3 text-slate-700 align-middle">
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900">{startItem}</strong> to{' '}
            <strong className="text-slate-900">{endItem}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> records
          </span>
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                {pageSizeOptions.map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="!py-1 !px-2 text-xs !border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="!py-1 !px-2 text-xs !border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

