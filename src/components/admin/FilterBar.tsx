import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  groupBy?: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  };
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  theme?: 'dark' | 'light';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filters = [],
  groupBy,
  activeFiltersCount = 0,
  onClearFilters,
  theme = 'dark'
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <input
            type="search"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {filters.map((filter, index) => (
          <select
            key={index}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className={`px-4 py-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {groupBy && (
          <select
            value={groupBy.value}
            onChange={(e) => groupBy.onChange(e.target.value)}
            className={`px-4 py-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">{groupBy.label}</option>
            {groupBy.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {activeFiltersCount > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                : 'bg-white text-gray-700 hover:bg-slate-100 border-gray-300'
            }`}
          >
            <X className="w-4 h-4" />
            <span className="text-sm">
              Effacer ({activeFiltersCount})
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
