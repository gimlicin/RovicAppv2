import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Star, ShoppingCart, Plus, Minus, ChevronRight } from 'lucide-react';
import ShopFrontLayout from '@/layouts/shop-front-layout';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  is_active: boolean;
  is_best_selling: boolean;
  is_promo?: boolean;
  weight: number;
  unit: string;
  category: {
    id: number;
    name: string;
  };
}

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetail({ product, relatedProducts }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image_url);
  const { addItem, openCart, updateQuantity } = useCart();

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = () => {
    // Add items to cart based on selected quantity
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        formatted_price: formatPrice(product.price),
        image_url: product.image_url,
        weight: product.weight,
        unit: product.unit,
        category: product.category
      });
    }
    
    // Open cart sidebar to show added items
    openCart();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  return (
    <ShopFrontLayout>
      <Head title={`${product.name} - Rovic Meat Products`} />
      
      <div className="min-h-screen bg-gray-50">

        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/products" className="text-gray-500 hover:text-gray-700">Products</Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
                <img
                  src={selectedImage || '/api/placeholder/500/500'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail images - if you have multiple images */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedImage(product.image_url)}
                  className="w-20 h-20 bg-white rounded-lg shadow-sm overflow-hidden border-2 border-red-500"
                >
                  <img
                    src={product.image_url || '/api/placeholder/80/80'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Category: {product.category.name}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-green-600">
                  {formatPrice(product.price)}
                </span>
                {product.weight && (
                  <span className="text-gray-500">
                    ({product.weight} {product.unit})
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {product.stock_quantity > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">In Stock</span>
                    <span className="text-gray-500">
                      ({(product as any).available_stock !== undefined ? (product as any).available_stock : product.stock_quantity} available)
                    </span>
                    {(product as any).available_stock !== undefined && (product as any).available_stock < product.stock_quantity && (
                      <span className="text-xs text-orange-600">
                        ({product.stock_quantity - (product as any).available_stock} reserved)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {product.is_best_selling && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-4 h-4 mr-1" />
                    Best Selling
                  </div>
                )}
                {product.is_promo && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    PROMO
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              {product.stock_quantity > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700 font-medium">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        disabled={quantity >= product.stock_quantity}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={addToCart}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/products/${relatedProduct.id}`}>
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={relatedProduct.image_url || '/api/placeholder/300/300'}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {relatedProduct.category.name}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {relatedProduct.is_best_selling && (
                              <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Best
                              </div>
                            )}
                            {relatedProduct.is_promo && (
                              <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                PROMO
                              </div>
                            )}
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.stock_quantity > 0 ? (
                            <span className="text-xs text-green-600">In Stock</span>
                          ) : (
                            <span className="text-xs text-red-600">Out of Stock</span>
                          )}
                        </div>
                        {relatedProduct.weight && (
                          <p className="text-sm text-gray-500 mt-1">
                            {relatedProduct.weight} {relatedProduct.unit}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </ShopFrontLayout>
  );
}
