import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
}

interface Filters {
  category_id?: string;
  search?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: boolean;
  sort?: string;
}

interface PriceRange {
  min: number;
  max: number;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: Filters;
  priceRange: PriceRange;
}

export default function ProductFiltersSimple({
  categories = [],
  filters = {},
  priceRange = { min: 0, max: 1000 },
}: ProductFiltersProps) {
  // Local state for filter values
  const [selectedCategory, setSelectedCategory] = useState<string>(filters?.category_id || '');
  const minPriceRef = useRef<HTMLInputElement | null>(null);
  const maxPriceRef = useRef<HTMLInputElement | null>(null);
  const [inStock, setInStock] = useState(filters?.in_stock || false);
  const [sortBy, setSortBy] = useState(filters?.sort || '');
  
  // UI state
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sanitizeNumericInput = (value: string) => value.replace(/[^0-9]/g, '');

  // Count active filters (based on applied filters from props)
  const activeFiltersCount = [
    selectedCategory,
    filters?.min_price,
    filters?.max_price,
    inStock,
    sortBy,
  ].filter(Boolean).length;

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.set('search', filters.search);
    }
    
    if (selectedCategory) {
      params.set('category_id', selectedCategory);
    }

    const rawMin = minPriceRef.current?.value || '';
    const rawMax = maxPriceRef.current?.value || '';
    const numericMin = sanitizeNumericInput(rawMin);
    const numericMax = sanitizeNumericInput(rawMax);

    if (numericMin) {
      params.set('min_price', numericMin);
    }
    
    if (numericMax) {
      params.set('max_price', numericMax);
    }

    if (inStock) {
      params.set('in_stock', '1');
    }

    if (sortBy) {
      params.set('sort', sortBy);
    }

    router.get(`/products?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false,
    });

    setIsMobileOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setInStock(false);
    setSortBy('');

    const params = new URLSearchParams();
    if (filters?.search) {
      params.set('search', filters.search);
    }

    router.get(`/products?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false,
    });

    setIsMobileOpen(false);
  };

  // Desktop Filter Content
  const FilterContent = () => (
    <>
      {/* Header with Active Filters Count */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {activeFiltersCount > 0 && (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-medium">
            {activeFiltersCount}
          </span>
        )}
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Stock Status */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
          />
          <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
            In Stock Only
          </span>
        </label>
      </div>

      {/* Categories */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-semibold text-sm text-gray-900">Categories</h3>
          {isCategoryOpen ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>
        
        {isCategoryOpen && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* All Categories Option */}
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={!selectedCategory}
                onChange={() => setSelectedCategory('')}
                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-2 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                All Categories
              </span>
            </label>

            {/* Individual Categories */}
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => (
                <label key={category.id} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === String(category.id)}
                    onChange={() => setSelectedCategory(String(category.id))}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                    {category.name}
                    {category.products_count !== undefined && (
                      <span className="ml-1 text-gray-400">({category.products_count})</span>
                    )}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500">No categories available</p>
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-semibold text-sm text-gray-900">Price Range</h3>
          {isPriceOpen ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>
        
        {isPriceOpen && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Min</label>
                <input
                  ref={minPriceRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  defaultValue={filters?.min_price || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end pb-2 text-gray-400">—</div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Max</label>
                <input
                  ref={maxPriceRef}
                  type="text"
                  inputMode="numeric"
                  placeholder={String(priceRange.max)}
                  defaultValue={filters?.max_price || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            {priceRange && (
              <p className="text-xs text-gray-500">
                Price range: ₱{priceRange.min} - ₱{priceRange.max}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={applyFilters}
          className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          Apply Filters
        </button>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Clear All Filters
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg"
        >
          <Filter size={20} />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-white text-orange-500 text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
