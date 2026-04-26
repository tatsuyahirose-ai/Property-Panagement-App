"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  loading?: boolean;
  error?: string | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  detailPath?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  description,
  onAdd,
  addLabel = "新規追加",
  loading = false,
  error = null,
  onEdit,
  onDelete,
  searchPlaceholder = "検索...",
  onSearch,
  filters,
  onFilterChange,
  onSort,
  detailPath,
}: DataTableProps<T>) {
  const showActions = onEdit || onDelete;
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  };

  const handleRowClick = (item: T) => {
    if (detailPath && item.id != null) {
      router.push(`${detailPath}/${item.id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {addLabel}
            </button>
          )}
        </div>

        {(onSearch || filters) && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {onSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
            {filters?.map((filter) => (
              <select
                key={filter.key}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="px-5 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable && onSort ? "cursor-pointer hover:text-gray-700 select-none" : ""
                  }`}
                  onClick={() => col.sortable && onSort && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && onSort && sortKey === col.key && (
                      <span className="text-blue-600">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </span>
                </th>
              ))}
              {showActions && (
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-5 py-8 text-center text-sm text-gray-500"
                >
                  読み込み中...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-5 py-8 text-center text-sm text-gray-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${detailPath ? "cursor-pointer" : ""}`}
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-3 text-sm text-gray-900"
                    >
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-5 py-3 text-sm text-right space-x-2">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          編集
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
