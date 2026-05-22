import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi';
import { SIZE_TYPES } from '../../utils/constants';

export default function BillboardFilters({ filters, onFilterChange, onClear, onSearch }) {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by title, address, or description..."
            className="input-field !pl-12"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
        <button onClick={onSearch} className="btn-primary">Search</button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          className="input-field"
          value={filters.size_type}
          onChange={(e) => onFilterChange('size_type', e.target.value)}
        >
          <option value="">All Sizes</option>
          {SIZE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="City"
          className="input-field"
          value={filters.city}
          onChange={(e) => onFilterChange('city', e.target.value)}
        />
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="illuminated"
            checked={filters.is_illuminated}
            onChange={(e) => onFilterChange('is_illuminated', e.target.checked)}
            className="w-5 h-5 rounded border-surface-600 bg-surface-700 text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="illuminated" className="text-sm text-surface-400">Illuminated</label>
        </div>

        <button onClick={onClear} className="text-sm text-surface-400 hover:text-white transition-colors flex items-center gap-1">
          <HiX /> Clear Filters
        </button>
      </div>
    </div>
  );
}
