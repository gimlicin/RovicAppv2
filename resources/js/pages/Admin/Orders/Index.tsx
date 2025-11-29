import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Eye, CheckCircle, XCircle, Clock, Package, User, Calendar, DollarSign, Download, Truck, ChefHat, Maximize2, FileSpreadsheet, RotateCcw, Ban, ThumbsDown, ThumbsUp, Box, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
  };
}

interface Order {
  id: number;
  status: string;
  is_returned?: boolean;
  payment_status: string;
  total_amount: number;
  pickup_or_delivery: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  payment_reference?: string | null;
  payment_method?: string | null;
  order_items?: OrderItem[];
  payment_proof?: string;
  next_status_options?: Record<string, string>;
  can_be_cancelled?: boolean;
  is_final_status?: boolean;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationData {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: PaginationLink[];
}

interface StatusCounts {
  all: number;
  pending: number;
  approved: number;
  preparing: number;
  ready: number;
  completed: number;
  returned: number;
  cancelled: number;
  rejected: number;
}

interface Props {
  orders: PaginationData;
  statusCounts: StatusCounts;
  filters: {
    status?: string;
    delivery_type?: string;
    bulk_orders?: boolean;
  };
}

function OrdersIndex({ orders, statusCounts, filters }: Props) {
  const { props } = usePage<any>();
  const csrfToken = props.csrf_token;

  const issueReceipt = (orderId: number) => {
    // Open printable invoice view in a new tab; it will auto-trigger browser print
    window.open(`/admin/orders/${orderId}/invoice/print`, '_blank');
  };

  // Map backend status filter to tab value (for initial render)
  const statusFilter = filters.status || 'all';
  const initialTab =
    statusFilter === 'payment_approved'
      ? 'approved'
      : statusFilter === 'payment_rejected'
        ? 'rejected'
        : statusFilter;

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; orderId: number } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogicalStatus = (order: Order): string => {
    if (order.status === 'cancelled' && order.is_returned) {
      return 'returned';
    }
    // Map underlying payment_* DB values to simplified logical stages
    if (order.status === 'payment_approved') {
      return 'approved';
    }
    if (order.status === 'payment_rejected') {
      return 'rejected';
    }
    return order.status;
  };

  const getStatusBadge = (status: string, pickupOrDelivery?: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
      approved: { variant: 'default' as const, label: 'Approved', icon: ThumbsUp, color: 'bg-blue-600' },
      rejected: { variant: 'destructive' as const, label: 'Rejected', icon: ThumbsDown, color: 'bg-red-600' },
      payment_submitted: { variant: 'outline' as const, label: 'Payment Submitted', icon: Clock, color: 'bg-blue-500' },
      payment_approved: { variant: 'default' as const, label: 'Payment Approved', icon: CheckCircle, color: 'bg-green-500' },
      confirmed: { variant: 'default' as const, label: 'Confirmed', icon: CheckCircle, color: 'bg-green-500' },
      preparing: { variant: 'default' as const, label: 'Preparing', icon: ChefHat, color: 'bg-purple-600' },
      ready: { 
        variant: 'default' as const, 
        label: 'Ready',
        icon: Package,
        color: 'bg-teal-600'
      },
      ready_for_pickup: { variant: 'default' as const, label: 'Ready for Pickup', icon: Package, color: 'bg-teal-500' },
      ready_for_delivery: { variant: 'default' as const, label: 'Ready for Delivery', icon: Truck, color: 'bg-teal-500' },
      completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle, color: 'bg-green-600' },
      returned: { variant: 'default' as const, label: 'Returned', icon: RotateCcw, color: 'bg-orange-500' },
      cancelled: { variant: 'default' as const, label: 'Cancelled', icon: Ban, color: 'bg-gray-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color} text-white`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending Payment', className: '' },
      submitted: { variant: 'outline' as const, label: 'Payment Submitted', className: 'text-blue-600 border-blue-600' },
      approved: { variant: 'default' as const, label: 'Payment Approved', className: 'bg-green-600' },
      rejected: { variant: 'destructive' as const, label: 'Payment Rejected', className: '' },
    };

    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    router.patch(`/admin/orders/${orderId}/status`, { 
      status: newStatus,
      _token: csrfToken
    }, {
      preserveScroll: true,
      onSuccess: () => {
        console.log('Order status updated successfully');
      },
      onError: (errors) => {
        console.error('Error updating order status:', errors);
      }
    });
  };

  const approvePayment = (orderId: number) => {
    router.patch(`/admin/orders/${orderId}/approve-payment`, {
      _token: csrfToken
    }, {
      preserveScroll: true,
      onSuccess: () => {
        console.log('Payment approved successfully');
      },
      onError: (errors) => {
        console.error('Error approving payment:', errors);
      }
    });
  };

  const rejectPayment = (orderId: number) => {
    setRejectOrderId(orderId);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const submitRejectPayment = () => {
    if (!rejectOrderId || !rejectReason.trim()) {
      return;
    }

    router.patch(`/admin/orders/${rejectOrderId}/reject-payment`, {
      rejection_reason: rejectReason.trim(),
      _token: csrfToken
    }, {
      preserveScroll: true,
      onSuccess: () => {
        console.log('Payment rejected successfully');
        setIsRejectDialogOpen(false);
        setRejectReason('');
        setRejectOrderId(null);
      },
      onError: (errors) => {
        console.error('Error rejecting payment:', errors);
      }
    });
  };

  const handleNextActionChange = (order: Order, action: string) => {
    if (!action) return;

    if (action === 'issue_receipt') {
      issueReceipt(order.id);
      return;
    }

    updateOrderStatus(order.id, action);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    router.get('/admin/orders', newFilters, { preserveState: true });
  };

  // Map tab value to actual DB status string
  const mapTabToStatus = (value: string): string => {
    if (value === 'approved') return 'payment_approved';
    if (value === 'rejected') return 'payment_rejected';
    if (value === 'all') return '';
    return value;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const status = mapTabToStatus(value);
    const newFilters = { ...filters, status };
    router.get('/admin/orders', newFilters, { preserveState: true, preserveScroll: true });
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const openPaymentProofLightbox = (order: Order) => {
    if (order.payment_proof) {
      setLightboxImage({
        src: `/admin/orders/${order.id}/payment-proof`,
        alt: `Payment Proof - Order #${order.id}`,
        orderId: order.id,
      });
      setIsLightboxOpen(true);
    }
  };

  const getOrderTimeline = (order: Order) => {
    const allSteps = [
      { status: 'pending', label: 'Order Placed', icon: ShoppingCart },
      { status: 'payment_approved', label: 'Approved', icon: ThumbsUp },
      { status: 'preparing', label: 'Preparing', icon: ChefHat },
      { status: 'ready', label: 'Ready', icon: Package },
      { status: 'completed', label: 'Completed', icon: Truck },
    ];

    // Determine which step is current
    const statusOrder = ['pending', 'payment_submitted', 'payment_approved', 'preparing', 'ready', 'completed', 'returned'];
    const logicalStatus = getLogicalStatus(order);
    const currentIndex = statusOrder.indexOf(logicalStatus);

    return (
      <div className="relative">
        <div className="absolute top-5 left-6 h-full w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {allSteps.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.status);
            const isCompleted = currentIndex >= stepIndex;
            const isCurrent = logicalStatus === step.status;
            const Icon = step.icon;

            return (
              <div key={step.status} className="relative flex items-start gap-4">
                <div className={`
                  relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 
                  ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}
                  ${isCurrent ? 'ring-4 ring-green-100' : ''}
                `}>
                  <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 pt-2">
                  <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-green-600 font-medium">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Show cancelled status if applicable */}
          {logicalStatus === 'cancelled' && (
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-red-500 border-red-500">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 pt-2">
                <p className="font-medium text-red-600">Order Cancelled</p>
              </div>
            </div>
          )}

          {logicalStatus === 'returned' && (
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-orange-500 border-orange-500">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 pt-2">
                <p className="font-medium text-orange-600">Order Returned</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title="Orders - Admin" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders and payments</p>
          </div>
        </div>

        {/* Status Tabs - Phase 5 */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1">{statusCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary" className="ml-1">{statusCounts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Approved
              <Badge variant="secondary" className="ml-1">{statusCounts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="preparing" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Preparing
              <Badge variant="secondary" className="ml-1">{statusCounts.preparing}</Badge>
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Ready
              <Badge variant="secondary" className="ml-1">{statusCounts.ready}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="ml-1">{statusCounts.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="returned" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Returned
              <Badge variant="secondary" className="ml-1">{statusCounts.returned}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Cancelled
              <Badge variant="secondary" className="ml-1">{statusCounts.cancelled}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4" />
              Rejected
              <Badge variant="secondary" className="ml-1">{statusCounts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Orders</CardTitle>
            <CardDescription>
              {orders.total} total orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">#{order.id.toString().padStart(6, '0')}</span>
                          <span className="text-sm text-muted-foreground capitalize">
                            {order.pickup_or_delivery || 'pickup'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {order.user ? order.user.name : order.customer_name || 'Guest'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.user ? order.user.email : order.customer_email || order.customer_phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.order_items?.length || 0} items</span>
                          <span className="text-sm text-muted-foreground">
                            {order.order_items?.slice(0, 2).map(item => item.product?.name).join(', ') || 'No items'}
                            {(order.order_items?.length || 0) > 2 && '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(getLogicalStatus(order), order.pickup_or_delivery)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Payment approval/rejection actions */}
                          {order.payment_status === 'submitted' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approvePayment(order.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                title="Approve Payment"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectPayment(order.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                title="Reject Payment"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Next Action dropdown */}
                          {order.payment_status === 'approved' && (
                            <>
                              {order.status === 'completed' ? (
                                // Completed & paid: allow processing return + issuing receipt
                                <Select onValueChange={(value) => handleNextActionChange(order, value)}>
                                  <SelectTrigger className="w-40">
                                    <span className="truncate text-sm text-muted-foreground">Next Action</span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {order.next_status_options &&
                                      Object.entries(order.next_status_options).map(([status, label]) => (
                                        <SelectItem key={status} value={status}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    <SelectItem value="issue_receipt">
                                      Issue Receipt (Print)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                order.next_status_options &&
                                Object.keys(order.next_status_options).length > 0 &&
                                !order.is_final_status && (
                                  <Select onValueChange={(value) => handleNextActionChange(order, value)}>
                                    <SelectTrigger className="w-40">
                                      <span className="truncate text-sm text-muted-foreground">Next Action</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(order.next_status_options).map(([status, label]) => (
                                        <SelectItem key={status} value={status}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )
                              )}
                            </>
                          )}
                          
                          {/* Show helpful messages for orders that can't proceed */}
                          {order.is_final_status && !(order.status === 'completed' && order.payment_status === 'approved') && (
                            <span className="text-xs text-muted-foreground italic">No actions</span>
                          )}
                          
                          {!order.is_final_status && order.payment_status !== 'approved' && order.payment_status !== 'submitted' && (
                            <span className="text-xs text-muted-foreground italic">Awaiting payment</span>
                          )}
                          
                          {!order.is_final_status && order.payment_status === 'submitted' && (
                            <span className="text-xs text-blue-600 italic">Review payment proof</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                <p className="text-muted-foreground">No orders match the current filters.</p>
              </div>
            )}
            
            {/* Pagination Info */}
            {orders.data.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Showing {orders.data.length} of {orders.total} orders
                </div>
                <div>
                  Page {orders.current_page} of {orders.last_page}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {orders.last_page > 1 && orders.links && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center gap-2" aria-label="Pagination">
                  {orders.links.map((link, index) => {
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

        {/* Order Details Modal */}
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="w-[95vw]! h-[90vh] max-w-none! max-h-none overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{selectedOrder?.id.toString().padStart(6, '0')}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                {/* Left Column - Customer & Order Info */}
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Customer</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {selectedOrder.user ? selectedOrder.user.name : selectedOrder.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.customer_phone}
                        </p>
                        {selectedOrder.customer_email && (
                          <p className="text-sm text-muted-foreground">
                            {selectedOrder.customer_email}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Order Date</span>
                      </div>
                      <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
                      <div className="mt-2">
                        <span className="text-sm font-medium">Delivery: </span>
                        <span className="text-sm capitalize">{selectedOrder.pickup_or_delivery}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Total Amount</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(selectedOrder.total_amount)}</p>
                      <div className="mt-2 space-y-1">
                        <div>{getStatusBadge(getLogicalStatus(selectedOrder), selectedOrder.pickup_or_delivery)}</div>
                        <div>{getPaymentStatusBadge(selectedOrder.payment_status)}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Payment Method:</span>{' '}
                          {selectedOrder.payment_method === 'qr' ? 'QR Code' : 'Cash'}
                        </div>
                        {selectedOrder.payment_reference && (
                          <div className="text-xs text-muted-foreground break-all">
                            <span className="font-medium">Reference:</span>{' '}
                            {selectedOrder.payment_reference}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Actions */}
                  {selectedOrder.payment_status === 'submitted' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Payment Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => {
                              approvePayment(selectedOrder.id);
                              setIsOrderModalOpen(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-sm"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Payment
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              rejectPayment(selectedOrder.id);
                              setIsOrderModalOpen(false);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Status Actions */}
                  {selectedOrder.next_status_options && Object.keys(selectedOrder.next_status_options).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Update Status</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Select onValueChange={(value) => {
                          updateOrderStatus(selectedOrder.id, value);
                          setIsOrderModalOpen(false);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Action" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(selectedOrder.next_status_options).map(([status, label]) => (
                              <SelectItem key={status} value={status}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Second Column - Order Timeline */}
                <div>
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Order Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {getOrderTimeline(selectedOrder)}
                    </CardContent>
                  </Card>
                </div>

                {/* Third Column - Order Items */}
                <div>
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {selectedOrder.order_items?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.product?.name || 'Unknown Product'}
                              </div>
                              <div className="text-muted-foreground">
                                {item.quantity} × {formatCurrency(item.price)}
                              </div>
                            </div>
                            <div className="font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Fourth Column - Payment Proof */}
                {selectedOrder.payment_proof && (
                  <div>
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Payment Proof</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div 
                            className="border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all relative group"
                            onClick={() => openPaymentProofLightbox(selectedOrder)}
                          >
                            <img
                              src={`/admin/orders/${selectedOrder.id}/payment-proof`}
                              alt="Payment Proof"
                              className="w-full h-auto max-h-[400px] object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="p-4 text-center text-muted-foreground text-sm">Unable to load payment proof image</div>';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex-1"
                              onClick={() => openPaymentProofLightbox(selectedOrder)}
                            >
                              <Maximize2 className="h-3 w-3 mr-1" />
                              View Full Size
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs flex-1"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/admin/orders/${selectedOrder.id}/payment-proof`;
                                link.download = `payment-proof-order-${selectedOrder.id}`;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Proof Lightbox */}
        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            title={lightboxImage.alt}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            showActions={selectedOrder?.payment_status === 'submitted'}
            onApprove={
              selectedOrder?.payment_status === 'submitted'
                ? () => {
                    router.patch(`/admin/orders/${lightboxImage.orderId}/approve-payment`, {}, {
                      onSuccess: () => {
                        setIsOrderModalOpen(false);
                        setIsLightboxOpen(false);
                      }
                    });
                  }
                : undefined
            }
            onReject={
              selectedOrder?.payment_status === 'submitted'
                ? () => {
                    if (lightboxImage) {
                      setIsOrderModalOpen(false);
                      setIsLightboxOpen(false);
                      rejectPayment(lightboxImage.orderId);
                    }
                  }
                : undefined
            }
          />
        )}

        <Dialog
          open={isRejectDialogOpen}
          onOpenChange={(open) => {
            setIsRejectDialogOpen(open);
            if (!open) {
              setRejectReason('');
              setRejectOrderId(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a clear reason for rejecting this payment proof. The customer will see this message.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border rounded-md text-sm"
                rows={4}
                placeholder="e.g. Screenshot is unclear or does not match the order total."
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectReason('');
                    setRejectOrderId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={submitRejectPayment}
                  disabled={!rejectReason.trim() || !rejectOrderId}
                >
                  Reject Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

OrdersIndex.layout = (page: React.ReactElement) => <AppLayout>{page}</AppLayout>;

export default OrdersIndex;
