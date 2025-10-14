'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { LoadingState } from '@/components/shared/loading-state'
import { DataTable, Column } from './data-table'
import { filterBySearch, sortBy as sortByField, sortByDate } from '@/lib/utils/filters'

export interface MobileCardProps<T> {
  item: T
  onAction?: (item: T) => void
}

export interface ResponsiveTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: (keyof T)[]
  sortable?: boolean
  sortOptions?: Array<{
    value: keyof T
    label: string
    type?: 'string' | 'date'
  }>
  defaultSortBy?: keyof T
  mobileCard?: React.ComponentType<MobileCardProps<T>>
  onRowClick?: (item: T) => void
  keyExtractor?: (item: T) => string
  summary?: (data: T[]) => React.ReactNode
  rowClassName?: string | ((item: T) => string)
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFields = [],
  sortable = false,
  sortOptions = [],
  defaultSortBy,
  mobileCard: MobileCard,
  onRowClick,
  keyExtractor,
  summary,
  rowClassName,
}: ResponsiveTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<keyof T | undefined>(defaultSortBy)

  const processedData = (() => {
    let result = [...data]

    // Apply search filter
    if (searchable && searchTerm && searchFields.length > 0) {
      result = filterBySearch(result, searchTerm, searchFields as string[])
    }

    // Apply sorting
    if (sortable && sortBy && sortOptions.length > 0) {
      const sortOption = sortOptions.find(opt => opt.value === sortBy)
      if (sortOption) {
        if (sortOption.type === 'date') {
          result = sortByDate(result, sortBy as string, 'desc')
        } else {
          result = sortByField(result, sortBy as string, 'asc')
        }
      }
    }

    return result
  })()

  if (loading) {
    return <LoadingState message={loadingMessage} size="md" />
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      {(searchable || sortable) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:max-w-sm"
            />
          )}
          {sortable && sortOptions.length > 0 && (
            <select
              value={sortBy as string}
              onChange={(e) => setSortBy(e.target.value as keyof T)}
              className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            >
              {sortOptions.map((option) => (
                <option key={option.value as string} value={option.value as string}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-4 text-center text-sm text-muted-foreground">
            Failed to load table
          </div>
        }
        enableRetry
      >
        <div className="hidden lg:block">
          <DataTable
            data={processedData}
            columns={columns}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
            keyExtractor={keyExtractor}
            rowClassName={rowClassName}
          />
        </div>
      </ErrorBoundary>

      {/* Mobile Card View */}
      {MobileCard && (
        <ErrorBoundary
          level="component"
          fallback={
            <div className="p-4 text-center text-sm text-muted-foreground">
              Failed to load cards
            </div>
          }
          enableRetry
        >
          <div className="lg:hidden space-y-4">
            {processedData.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">
                {emptyMessage}
              </div>
            ) : (
              processedData.map((item, index) => (
                <MobileCard
                  key={keyExtractor ? keyExtractor(item) : index}
                  item={item}
                  onAction={onRowClick}
                />
              ))
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* Summary */}
      {summary && processedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          {summary(processedData)}
        </div>
      )}
    </div>
  )
}
