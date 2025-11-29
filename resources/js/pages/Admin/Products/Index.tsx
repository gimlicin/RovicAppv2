import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Package, Plus, Edit, Trash2, Star, ToggleLeft, ToggleRight, AlertTriangle, TrendingDown, Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  reserved_stock?: number;
  low_stock_threshold?: number;
  max_order_quantity?: number;
  track_stock?: boolean;
  category: {
    name: string;
  };
  is_active: boolean;
  is_best_selling: boolean;
  created_at: string;
}

interface Stats {
  total_products: number;
  active_products: number;
  best_selling_products: number;
  total_inventory_value: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationData {
  data: Product[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: PaginationLink[];
}

interface Props {
  products: PaginationData;
  stats: Stats;
  filters?: {
    stock_filter?: string;
  };
}

function ProductsIndex({ products, stats, filters }: Props) {
  const [stockAdjustModal, setStockAdjustModal] = useState<{ product: Product | null; isOpen: boolean }>({
    product: null,
    isOpen: false
  });
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'add',
    quantity: 0,
    reason: ''
  });

  const activeStockFilter = filters?.stock_filter || 'all';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (product: Product) => {
    if (!product.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (product.stock_quantity === 0) {
      return <Badge variant="secondary">Out of Stock</Badge>;
    }
    const threshold = product.low_stock_threshold || 5;
    if (product.stock_quantity <= threshold) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">In Stock</Badge>;
  };

  const getAvailableStock = (product: Product) => {
    const reserved = product.reserved_stock || 0;
    return Math.max(0, product.stock_quantity - reserved);
  };

  const handleStockFilterChange = (value: string) => {
    const params: Record<string, any> = {};
    if (value && value !== 'all') {
      params.stock_filter = value;
    }

    router.get('/admin/products', params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const toggleBestSelling = (productId: number) => {
    router.patch(`/admin/products/${productId}/toggle-best-selling`, {}, {
      preserveScroll: true,
    });
  };

  const toggleActive = (productId: number) => {
    router.patch(`/admin/products/${productId}/toggle-active`, {}, {
      preserveScroll: true,
    });
  };

  const deleteProduct = (productId: number, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      router.delete(`/admin/products/${productId}`);
    }
  };

  const openStockAdjustModal = (product: Product) => {
    setStockAdjustModal({ product, isOpen: true });
    setAdjustmentData({ adjustment_type: 'add', quantity: 0, reason: '' });
  };

  const closeStockAdjustModal = () => {
    setStockAdjustModal({ product: null, isOpen: false });
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustModal.product) return;
    
    router.patch(`/admin/products/${stockAdjustModal.product.id}/adjust-stock`, adjustmentData, {
      onSuccess: () => {
        closeStockAdjustModal();
      },
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Products - Admin" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/admin/products/low-stock">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Low Stock
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Selling</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.best_selling_products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_inventory_value)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>All Products</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeStockFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStockFilterChange('all')}
              >
                All
              </Button>
              <Button
                variant={activeStockFilter === 'in_stock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStockFilterChange('in_stock')}
              >
                On Stock
              </Button>
              <Button
                variant={activeStockFilter === 'low_stock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStockFilterChange('low_stock')}
              >
                Low Stock
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Best Selling</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="font-medium">{product.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.stock_quantity}</span>
                        {product.reserved_stock && product.reserved_stock > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({product.reserved_stock} reserved)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getAvailableStock(product) === 0 ? 'text-red-600 font-medium' : ''}>
                        {getAvailableStock(product)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(product)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBestSelling(product.id)}
                      >
                        {product.is_best_selling ? (
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStockAdjustModal(product)}
                          title="Adjust Stock"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(product.id)}
                        >
                          {product.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {products.data.length} of {products.total} products
              </div>
              <div>
                Page {products.current_page} of {products.last_page}
              </div>
            </div>

            {/* Pagination Controls */}
            {products.last_page > 1 && products.links && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center gap-2" aria-label="Pagination">
                  {products.links.map((link, index) => {
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
          </CardContent>
        </Card>

        {/* Stock Adjustment Modal */}
        {stockAdjustModal.isOpen && stockAdjustModal.product && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">
                Adjust Stock: {stockAdjustModal.product.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <p className="text-lg font-semibold">{stockAdjustModal.product.stock_quantity}</p>
                  {stockAdjustModal.product.reserved_stock && stockAdjustModal.product.reserved_stock > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ({stockAdjustModal.product.reserved_stock} reserved)
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentData.adjustment_type}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustment_type: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="add">Add Stock</option>
                    <option value="subtract">Remove Stock</option>
                    <option value="set">Set Stock</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={adjustmentData.quantity}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                    placeholder="e.g., Damaged goods, Restock, Inventory count"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={closeStockAdjustModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleStockAdjustment}>
                    Update Stock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

ProductsIndex.layout = (page: React.ReactElement) => <AppLayout>{page}</AppLayout>;

export default ProductsIndex;
