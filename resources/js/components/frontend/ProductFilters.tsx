import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { X, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
// import { Button } from '@/components/ui/button'; // TEMPORARILY DISABLED - testing for Object.entries error
// import { Checkbox } from '@/components/ui/checkbox'; // TEMPORARILY DISABLED - causes Object.entries error
// import { Label } from '@/components/ui/label'; // TEMPORARILY DISABLED - testing for Object.entries error
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from '@/components/ui/sheet'; // TEMPORARILY DISABLED - causes Object.entries error

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

export default function ProductFilters({
  categories = [],
  filters = {},
  priceRange = { min: 0, max: 1000 },
}: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters?.category_id ? [filters.category_id] : []
  );
  const [minPrice, setMinPrice] = useState(filters?.min_price || '');
  const [maxPrice, setMaxPrice] = useState(filters?.max_price || '');
  const [inStockOnly, setInStockOnly] = useState(filters?.in_stock || false);
  const [sortBy, setSortBy] = useState(filters?.sort || 'featured');
  const [showCategories, setShowCategories] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showStock, setShowStock] = useState(true);

  const sanitizeNumericInput = (value: string) => value.replace(/[^0-9]/g, '');

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();

    // Keep existing search query
    if (filters?.search) {
      params.set('search', filters.search);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      params.set('category_id', selectedCategories[0]);
    }

    // Price range (sanitize before sending)
    const numericMin = sanitizeNumericInput(minPrice);
    const numericMax = sanitizeNumericInput(maxPrice);

    if (numericMin) {
      params.set('min_price', numericMin);
    }
    if (numericMax) {
      params.set('max_price', numericMax);
    }

    // Stock filter
    if (inStockOnly) {
      params.set('in_stock', '1');
    }

    // Sort
    if (sortBy && sortBy !== 'featured') {
      params.set('sort', sortBy);
    }

    router.get(`/products?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('featured');

    const params = new URLSearchParams();
    if (filters?.search) {
      params.set('search', filters.search);
    }

    router.get(`/products?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false,
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    inStockOnly ||
    (sortBy && sortBy !== 'featured');

  // Filter content component (reusable for both desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-4 border-b">
          <span className="text-sm font-medium">Active Filters</span>
          <button
            onClick={clearFilters}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Sort Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Sort By</h3>
        </div>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            // Apply immediately for sort
            const params = new URLSearchParams(window.location.search);
            if (e.target.value && e.target.value !== 'featured') {
              params.set('sort', e.target.value);
            } else {
              params.delete('sort');
            }
            router.get(`/products?${params.toString()}`, {}, {
              preserveState: true,
              preserveScroll: true,
            });
          }}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="featured">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Categories */}
      <div className="space-y-3 border-t pt-6">
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-sm">Categories</h3>
          {showCategories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showCategories && (
          <div className="space-y-2">
            {Array.isArray(categories) && categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id.toString())}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([category.id.toString()]);
                    } else {
                      setSelectedCategories([]);
                    }
                  }}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
                  {category.products_count !== undefined && (
                    <span className="text-gray-400 ml-1">
                      ({category.products_count})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-3 border-t pt-6">
        <button
          onClick={() => setShowPrice(!showPrice)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-sm">Price Range</h3>
          {showPrice ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showPrice && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={`Min (₱${priceRange.min})`}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={`Max (₱${priceRange.max})`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Range: ₱{priceRange.min.toFixed(2)} - ₱{priceRange.max.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Stock Availability */}
      <div className="space-y-3 border-t pt-6">
        <button
          onClick={() => setShowStock(!showStock)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-sm">Availability</h3>
          {showStock ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showStock && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="in-stock"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="in-stock" className="text-sm cursor-pointer">
              In Stock Only
            </label>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="pt-4 border-t">
        <button
          onClick={applyFilters}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Filters
            </h2>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Message - Sheet component temporarily disabled */}
      <div className="lg:hidden p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
        <p className="font-semibold mb-1">Filters (Desktop Only)</p>
        <p className="text-xs">Please use a desktop browser to access filters. Mobile filters coming soon!</p>
      </div>
    </>
  );
}
