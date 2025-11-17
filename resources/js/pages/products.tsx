import { Head, Link } from '@inertiajs/react';
import ShopFrontLayout from '@/layouts/shop-front-layout';
import ProductFiltersSimple from '@/components/frontend/ProductFiltersSimple';
import { Grid, List, ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: number;
  name: string;
  price: number;
  formatted_price: string;
  description: string;
  image_url: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  is_best_seller: boolean;
  is_promo?: boolean;
  stock_quantity: number;
  weight: number;
  unit: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface ProductsPageProps {
  products: {
    data: Product[];
    links: PaginationLink[];
    meta: {
      current_page: number;
      from: number;
      to: number;
      total: number;
      per_page: number;
      last_page: number;
    };
  };
  categories: Category[];
  filters: {
    category_id?: string;
    search?: string;
    best_sellers?: boolean;
    min_price?: string;
    max_price?: string;
    in_stock?: boolean;
    sort?: string;
  };
  priceRange: {
    min: number;
    max: number;
  };
}

function ProductsPageInner({ products, categories = [], filters = {}, priceRange = { min: 0, max: 1000 } }: ProductsPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addItem, openCart } = useCart();

  // Safety check for products data
  if (!products || !products.data) {
    console.error('Products data is undefined or malformed:', products);
    return (
      <ShopFrontLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
              <p className="text-gray-600">Unable to load products. Please refresh the page.</p>
              <pre className="mt-4 text-left bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(products, null, 2)}
              </pre>
            </div>
          </main>
        </div>
      </ShopFrontLayout>
    );
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      formatted_price: product.formatted_price,
      image_url: product.image_url,
      weight: product.weight,
      unit: product.unit,
      category: product.category,
    });
    openCart();
  };

  // Product Grid Card
  const GridProductCard = ({ product }: { product: Product }) => (
    <div className="group relative flex flex-col h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative w-full pb-[100%] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <Link href={`/products/${product.id}`} className="absolute inset-0">
          <img
            src={product.image_url || '/images/placeholder-product.svg'}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
        </Link>
        {product.is_best_seller && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md z-10">
            BEST SELLER
          </span>
        )}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-md z-10">
            LOW STOCK
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart(product);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-md transition-colors"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>
      <div className="flex flex-col p-4">
        <Link href={`/products/${product.id}`}>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {product.category.name}
          </span>
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mt-1 hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>{product.weight} {product.unit}</span>
          </div>
        </Link>
        
        {/* Price and Stock - More Prominent */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-orange-600">
              {product.formatted_price}
            </span>
            <span className="text-xs text-gray-500">per {product.unit}</span>
          </div>
          <div>
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Product List Card
  const ListProductCard = ({ product }: { product: Product }) => (
    <div className="group relative flex flex-col sm:flex-row h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative w-full sm:w-48 md:w-56 lg:w-64 h-48 sm:h-auto bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={product.image_url || '/images/placeholder-product.svg'}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
        </Link>
        {product.is_best_seller && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
            BEST SELLER
          </span>
        )}
      </div>
      <div className="flex flex-col p-4 flex-grow">
        <div className="mb-1.5 flex justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {product.category.name}
            </span>
            <Link href={`/products/${product.id}`}>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-1 hover:text-red-600 transition-colors">
                {product.name}
              </h3>
            </Link>
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">
              {product.weight} {product.unit}
            </span>
          </div>
          <div className="flex flex-col items-end justify-between">
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-orange-600">
                {product.formatted_price}
              </span>
              <span className="text-xs text-gray-500">per {product.unit}</span>
            </div>
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                Out of Stock
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex gap-3 mt-auto">
          <button
            onClick={() => handleAddToCart(product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-md transition-colors"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
          <Link
            href={`/products/${product.id}`}
            className="px-3 py-2 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors flex items-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <ShopFrontLayout>
      <Head title={filters?.search ? `Search: ${filters.search}` : 'All Products - Rovic Meat Products'} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        
        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {filters?.search ? `Search Results for "${filters.search}"` : 'All Products'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filters?.search
                ? `Found ${products?.meta?.total || 0} products`
                : 'Browse our complete selection of premium meat products'}
            </p>
          </div>

          {/* Main Content with Filters */}
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <ProductFiltersSimple
              categories={categories}
              filters={filters}
              priceRange={priceRange}
            />

            {/* Products Section */}
            <div className="flex-1">
              {/* View Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {products?.data && products.data.length > 0 ? (
                    <>
                      Showing{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {products.meta?.from || 1} - {products.meta?.to || products.data.length}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {products.meta?.total || products.data.length}
                      </span>{' '}
                      products
                    </>
                  ) : (
                    <span>No products found</span>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {/* Products Grid/List */}
              {products?.data && products.data.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products?.data?.map((product) => (
                        <GridProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {products?.data?.map((product) => (
                        <ListProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {(() => {
                    console.log('Pagination check:', {
                      hasLinks: !!products?.links,
                      linksCount: products?.links?.length,
                      lastPage: products?.meta?.last_page,
                      currentPage: products?.meta?.current_page,
                      total: products?.meta?.total,
                    });
                    return null;
                  })()}
                  {products?.links && products.links.length > 3 && (
                    <div className="mt-12 flex justify-center relative z-10">
                      <nav className="flex items-center gap-2" aria-label="Pagination">
                        {products.links.map((link, index) => {
                          // Clean up label - remove HTML entities
                          const label = link.label
                            .replace('&laquo;', '«')
                            .replace('&raquo;', '»');

                          if (link.url === null) {
                            return (
                              <span
                                key={index}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                              >
                                {label}
                              </span>
                            );
                          }

                          return (
                            <Link
                              key={index}
                              href={link.url}
                              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer inline-block ${
                                link.active
                                  ? 'bg-orange-600 text-white border-2 border-orange-600'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                              }`}
                            >
                              {label}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <ShoppingCart size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    We couldn't find any products matching your filters. Try adjusting your search criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ShopFrontLayout>
  );
}

// Error-catching wrapper
export default function ProductsPage(props: ProductsPageProps) {
  try {
    return <ProductsPageInner {...props} />;
  } catch (error) {
    console.error('Error rendering ProductsPage:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'red' }}>Error Loading Products Page</h1>
        <p>An error occurred while rendering the products page.</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <h3>Props received:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(props, null, 2)}
        </pre>
      </div>
    );
  }
}
