'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  Calendar,
  Hash,
  SortAsc,
  FileText,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  sortBy: string;
  dateRange: string;
  complexity: string;
  minSize: string;
  maxSize: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories?: string[];
  availableTags?: string[];
  className?: string;
}

export function AdvancedSearch({
  filters,
  onFiltersChange,
  categories = [
    'API Response',
    'Configuration', 
    'Database Schema',
    'Test Data',
    'Template',
    'Example'
  ],
  availableTags = [],
  className
}: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simple update helper following DRY principle
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Count active filters (excluding query and sortBy)
  const activeFiltersCount = [
    filters.category,
    filters.tags?.length > 0 ? 'tags' : '',
    filters.dateRange,
    filters.complexity,
    filters.minSize,
    filters.maxSize
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      query: filters.query,
      category: '',
      tags: [],
      sortBy: filters.sortBy,
      dateRange: '',
      complexity: '',
      minSize: '',
      maxSize: ''
    });
  };

  const removeTag = (tagToRemove: string) => {
    updateFilter('tags', (filters.tags || []).filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main search row */}
      <div className="flex gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or tags..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-[140px]">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              More
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </label>
                <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="day">Past day</SelectItem>
                    <SelectItem value="week">Past week</SelectItem>
                    <SelectItem value="month">Past month</SelectItem>
                    <SelectItem value="year">Past year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complexity */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Complexity
                </label>
                <Select value={filters.complexity} onValueChange={(value) => updateFilter('complexity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any complexity</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                    <SelectItem value="very complex">Very Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Size Range
                </label>
                <div className="flex gap-2">
                  <Select value={filters.minSize} onValueChange={(value) => updateFilter('minSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No min</SelectItem>
                      <SelectItem value="1kb">1 KB</SelectItem>
                      <SelectItem value="10kb">10 KB</SelectItem>
                      <SelectItem value="100kb">100 KB</SelectItem>
                      <SelectItem value="1mb">1 MB</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.maxSize} onValueChange={(value) => updateFilter('maxSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Max" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No max</SelectItem>
                      <SelectItem value="10kb">10 KB</SelectItem>
                      <SelectItem value="100kb">100 KB</SelectItem>
                      <SelectItem value="1mb">1 MB</SelectItem>
                      <SelectItem value="10mb">10 MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active tags display */}
      {filters.tags && filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" />
            Tags:
          </span>
          {(filters.tags || []).map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Active filters summary */}
      {activeFiltersCount > 0 && (
        <div className="text-xs text-muted-foreground">
          {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} applied
        </div>
      )}
    </div>
  );
}