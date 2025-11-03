'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T) => string;
  rowClassName?: string | ((item: T) => string);
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  keyExtractor,
  rowClassName,
}: DataTableProps<T>) {
  const getRowKey = (item: T, index: number): string => {
    if (keyExtractor) return keyExtractor(item);
    if ('id' in item && typeof item.id === 'string') return item.id;
    return index.toString();
  };

  const getCellValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.render) return column.render(item);
    return item[column.key as keyof T] as React.ReactNode;
  };

  const getRowClassName = (item: T): string => {
    const baseClass = onRowClick ? 'cursor-pointer hover:bg-muted/50' : '';
    if (typeof rowClassName === 'function') {
      return `${baseClass} ${rowClassName(item)}`.trim();
    }
    return `${baseClass} ${rowClassName || ''}`.trim();
  };

  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.headerClassName}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={getRowKey(item, index)}
              onClick={() => onRowClick?.(item)}
              className={getRowClassName(item)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.className}>
                  {getCellValue(item, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
