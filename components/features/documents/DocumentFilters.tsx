'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc, Eye, Lock, Globe, Clock, Calendar } from 'lucide-react';
import { DocumentListFilters } from '@/hooks/use-document-list';
import { AdvancedSearch } from '@/components/ui/advanced-search';
import { getCategoryIcon } from '@/components/features/documents';

interface DocumentFiltersProps {
  filters: DocumentListFilters;
  onFiltersChange: (filters: DocumentListFilters | ((prev: DocumentListFilters) => DocumentListFilters)) => void;
  showAdvancedSearch?: boolean;
  showCategoryFilter?: boolean;
  showVisibilityFilter?: boolean;
  showSortBy?: boolean;
  placeholder?: string;
  testId?: string;
  className?: string;
}

/**
 * Reusable document filters component
 * Supports different filter combinations for various document list pages
 */
export function DocumentFilters({
  filters,
  onFiltersChange,
  showAdvancedSearch = false,
  showCategoryFilter = false,
  showVisibilityFilter = false,
  showSortBy = true,
  placeholder = 'Search...',
  testId = 'document-filters',
  className = '',
}: DocumentFiltersProps) {
  // Use AdvancedSearch for public library
  if (showAdvancedSearch) {
    return (
      <AdvancedSearch
        filters={filters}
        onFiltersChange={onFiltersChange}
        className={className}
      />
    );
  }

  // Simple filters for private library and saved pages
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`} data-testid={testId}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={filters.query || ''}
          onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
          className="pl-10 h-10"
          data-testid={`${testId}-search`}
        />
      </div>

      {/* Category Filter */}
      {showCategoryFilter && (
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, category: value === 'all' ? '' : value })}
          data-testid={`${testId}-category`}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="API Response">
              <div className="flex items-center gap-2">
                {getCategoryIcon('API Response')}
                API Response
              </div>
            </SelectItem>
            <SelectItem value="Configuration">
              <div className="flex items-center gap-2">
                {getCategoryIcon('Configuration')}
                Configuration
              </div>
            </SelectItem>
            <SelectItem value="Database Schema">
              <div className="flex items-center gap-2">
                {getCategoryIcon('Database Schema')}
                Database Schema
              </div>
            </SelectItem>
            <SelectItem value="Test Data">
              <div className="flex items-center gap-2">
                {getCategoryIcon('Test Data')}
                Test Data
              </div>
            </SelectItem>
            <SelectItem value="Template">
              <div className="flex items-center gap-2">
                {getCategoryIcon('Template')}
                Template
              </div>
            </SelectItem>
            <SelectItem value="Example">
              <div className="flex items-center gap-2">
                {getCategoryIcon('Example')}
                Example
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Visibility Filter */}
      {showVisibilityFilter && (
        <Select
          value={filters.visibility || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, visibility: value === 'all' ? '' : value })}
          data-testid={`${testId}-visibility`}
        >
          <SelectTrigger className="w-full sm:w-[140px] h-10">
            <Eye className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private
              </div>
            </SelectItem>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Sort By */}
      {showSortBy && (
        <Select
          value={filters.sortBy || 'recent'}
          onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          data-testid={`${testId}-sort`}
        >
          <SelectTrigger className="w-full sm:w-[140px] h-10">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </div>
            </SelectItem>
            <SelectItem value="updated">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Updated
              </div>
            </SelectItem>
            <SelectItem value="views">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Most Viewed
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
