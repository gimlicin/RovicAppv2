import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Package, Users, FolderOpen, DollarSign, Plus, MoreHorizontal, ShoppingCart, Clock, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LiveClock } from '@/components/live-clock';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  category: {
    name: string;
  };
  is_active: boolean;
  is_best_selling: boolean;
}

interface Order {
  id: number;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  user: {
    name: string;
  } | null;
  customer_name: string;
  order_items?: Array<{
    product: {
      name: string;
    };
  }>;
}

interface Stats {
  total_products: number;
  total_users: number;
  total_categories: number;
  total_inventory_value: number;
  total_orders: number;
  pending_orders: number;
  pending_payments: number;
  total_revenue: number;
}

interface ActivityLogUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  stats: Stats;
  recentProducts: Product[];
  recentOrders: Order[];
  activityLogUsers: ActivityLogUser[];
  activityLogActions: string[];
}

function Dashboard({ stats, recentProducts, recentOrders, activityLogUsers, activityLogActions }: Props) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('orders');
  const [period, setPeriod] = useState<string>('daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityUserId, setActivityUserId] = useState<string>('all');
  const [activityRole, setActivityRole] = useState<string>('all');
  const [activityAction, setActivityAction] = useState<string>('all');

  const isCustom = period === 'custom';
  const isOrdersReport = reportType === 'orders';
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
    if (product.stock_quantity <= 5) {
      return <Badge variant="outline">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      // Orders
      order_status_updated: 'Order status updated',
      order_payment_approved: 'Payment approved',
      order_payment_rejected: 'Payment rejected',

      // Products
      product_created: 'Product created',
      product_updated: 'Product updated',
      product_deleted: 'Product deleted',
      product_best_selling_toggled: 'Product best-selling status changed',
      product_active_toggled: 'Product visibility changed',
      product_stock_adjusted: 'Product stock adjusted',
      product_bulk_stock_updated: 'Product stock updated (bulk)',

      // Categories
      category_created: 'Category created',
      category_updated: 'Category updated',
      category_deleted: 'Category deleted',
      category_active_toggled: 'Category visibility changed',

      // Payment settings
      payment_setting_created: 'Payment method added',
      payment_setting_updated: 'Payment method updated',
      payment_setting_deleted: 'Payment method deleted',
      payment_setting_active_toggled: 'Payment method visibility changed',

      // Users
      user_created: 'User created',
      user_updated: 'User updated',
      user_deleted: 'User deleted',
      user_verification_toggled: 'User verification updated',
    };

    if (labels[action]) {
      return labels[action];
    }

    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <Head title="Super Admin Dashboard" />
      
      <div className="space-y-6">
        {/* Header with Live Clock */}
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2">
              <LiveClock />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your store.</p>
          </div>
        </div>

        {/* Export Reports shortcut */}
        <div className="flex justify-end">
          <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export Reports
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{isOrdersReport ? 'Export Order Report' : 'Export Activity Logs'}</DialogTitle>
                <DialogDescription>
                  {isOrdersReport
                    ? 'Choose a period and download the official order list PDF with payment reference numbers.'
                    : 'Choose a period and download a PDF audit trail of admin and super admin actions.'}
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();

                  const params = new URLSearchParams();
                  params.set('period', period);

                  if (isCustom) {
                    if (startDate) params.set('start_date', startDate);
                    if (endDate) params.set('end_date', endDate);
                  }

                  if (!isOrdersReport) {
                    if (activitySearch.trim()) params.set('search', activitySearch.trim());
                    if (activityUserId !== 'all') params.set('user_id', activityUserId);
                    if (activityRole !== 'all') params.set('role', activityRole);
                    if (activityAction !== 'all') params.set('action', activityAction);
                  }

                  const baseUrl =
                    reportType === 'orders'
                      ? '/super-admin/reports/orders/pdf'
                      : '/super-admin/reports/activity-logs/pdf';

                  const url = `${baseUrl}?${params.toString()}`;
                  window.open(url, '_blank');
                }}
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Report type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="orders">Orders</option>
                      <option value="activity_logs">Activity Logs</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 items-end">
                    <div className="space-y-1 md:col-span-1">
                      <label htmlFor="period" className="text-sm font-medium">
                        Period
                      </label>
                      <select
                        id="period"
                        name="period"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                      >
                        <option value="daily">Today</option>
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="yearly">This Year</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {isCustom && (
                      <>
                        <div className="space-y-1">
                          <label htmlFor="start_date" className="text-sm font-medium">
                            Start Date
                          </label>
                          <input
                            id="start_date"
                            name="start_date"
                            type="date"
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="end_date" className="text-sm font-medium">
                            End Date
                          </label>
                          <input
                            id="end_date"
                            name="end_date"
                            type="date"
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {!isOrdersReport && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Search (optional)</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="Search description or action"
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">User</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={activityUserId}
                          onChange={(e) => setActivityUserId(e.target.value)}
                        >
                          <option value="all">All users</option>
                          {activityLogUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Role</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={activityRole}
                          onChange={(e) => setActivityRole(e.target.value)}
                        >
                          <option value="all">All roles</option>
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">Action</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={activityAction}
                          onChange={(e) => setActivityAction(e.target.value)}
                        >
                          <option value="all">All actions</option>
                          {activityLogActions.map((action) => (
                            <option key={action} value={action}>
                              {getActionLabel(action)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {isOrdersReport
                      ? 'The generated PDF includes order list, customer details, payment status, and payment reference numbers for the selected period.'
                      : 'The generated PDF includes activity time, admin user, role, action, description, and IP address for the selected period.'}
                  </p>

                  <Button type="submit" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/admin/orders" className="text-primary hover:underline">
                  View all orders
                </Link>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_orders}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_payments}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                From paid orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_products}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/admin/products" className="text-primary hover:underline">
                  View all products
                </Link>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                Customer accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_categories}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/super-admin/categories" className="text-primary hover:underline">
                  Manage categories
                </Link>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_inventory_value)}</div>
              <p className="text-xs text-muted-foreground">
                Total stock value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders and Products */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/orders">
                    View All Orders
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">#{order.id.toString().padStart(6, '0')}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.user ? order.user.name : order.customer_name || 'Guest'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.order_items?.length || 0} items • {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                          {order.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Products</CardTitle>
                  <CardDescription>Latest products added</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/products/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(product.price)} • Stock: {product.stock_quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(product)}
                        {product.is_best_selling && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Best Selling
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2" />
                  <p>No products yet</p>
                </div>
              )}
              <div className="mt-4 text-center">
                <Link href="/admin/products" className="text-primary hover:underline text-sm">
                  View all products →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

Dashboard.layout = (page: React.ReactElement) => <AppLayout>{page}</AppLayout>;

export default Dashboard;
