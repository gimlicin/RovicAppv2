import ProductListing from '@/components/frontend/ProductListing'
import ShopFrontLayout from '@/layouts/shop-front-layout'
import React, { useState } from 'react'

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

interface HomeProps {
  featuredProducts: Product[];
  categories: Category[];
}

export default function home({ featuredProducts = [], categories = [] }: HomeProps) {
  const [selectedCategoryId] = useState<number | null>(null);

  const handleScrollToProducts = () => {
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ShopFrontLayout>
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Blurred background image with subtle red/yellow vignette */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/images/landing-bg.jpg"
            alt="Fresh quality meat products"
            className="w-full h-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/80 to-black" />
          <div className="absolute inset-0 bg-linear-to-tr from-red-900/40 via-transparent to-yellow-600/25 mix-blend-overlay" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-8">
          {/* Compact intro section */}
          <section className="max-w-2xl text-white">
            <p className="text-xs md:text-sm font-medium tracking-wide uppercase text-orange-300 mb-2">
              Fresh from trusted suppliers
            </p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Fresh Quality Meat Products
            </h1>
            <p className="text-sm md:text-base text-gray-100 max-w-xl mb-4">
              Browse our selection of premium meats and processed products, with easy online
              ordering and reliable delivery from Rovic Meat Products.
            </p>
            <button
              type="button"
              onClick={handleScrollToProducts}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-colors"
            >
              Shop Products
            </button>
          </section>

          {/* Products section - visible right after intro */}
          <section id="products" className="pb-8 md:pb-10">
            <ProductListing
              initialProducts={Array.isArray(featuredProducts) ? featuredProducts : []}
              initialCategories={Array.isArray(categories) ? categories : []}
              selectedCategoryId={selectedCategoryId}
            />
          </section>
        </div>
      </div>
    </ShopFrontLayout>
  );
}
