import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import ShopFrontLayout from '@/layouts/shop-front-layout';
import { CheckCircle, Package, Phone, Mail, FileText } from 'lucide-react';

interface OrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        price: number;
        image_url?: string;
    };
    quantity: number;
    price: number;
    total_price: number;
    notes?: string;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    status: string;
    total_amount: number;
    pickup_or_delivery: string;
    payment_method: string;
    payment_status: string;
    payment_reference?: string | null;
    notes?: string;
    created_at: string;
    order_items: OrderItem[];
}

interface Props {
    order: Order;
    [key: string]: any;
}

export default function OrderConfirmation() {
    const { order } = usePage<Props>().props;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'payment_submitted':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'confirmed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'preparing':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ready_for_pickup':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ready_for_delivery':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ShopFrontLayout>
            <Head title={`Order Confirmation #${order.id} - Rovic Meat Products`} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                        <p className="text-gray-600">Thank you for your order. We'll process it shortly.</p>
                    </div>

                    {/* Order Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm border mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Order #{order.id}</h2>
                                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                </div>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.payment_status)}`}>
                                    <span>{order.payment_method === 'qr' ? 'Payment Submitted' : formatStatus(order.payment_status)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <Phone className="w-5 h-5 mr-2 text-gray-400" />
                                        Customer Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <span className="text-sm font-medium text-gray-500 w-20">Name:</span>
                                            <span className="text-sm text-gray-900">{order.customer_name}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-sm font-medium text-gray-500 w-20">Phone:</span>
                                            <span className="text-sm text-gray-900">{order.customer_phone}</span>
                                        </div>
                                        {order.customer_email && (
                                            <div className="flex items-start">
                                                <span className="text-sm font-medium text-gray-500 w-20">Email:</span>
                                                <span className="text-sm text-gray-900">{order.customer_email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <Package className="w-5 h-5 mr-2 text-gray-400" />
                                        Order Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <span className="text-sm font-medium text-gray-500 w-20">Type:</span>
                                            <span className="text-sm text-gray-900 capitalize">{order.pickup_or_delivery}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-sm font-medium text-gray-500 w-20">Payment:</span>
                                            <span className="text-sm text-gray-900 capitalize">{order.payment_method === 'qr' ? 'QR Code' : 'Cash'}</span>
                                        </div>
                                        {order.payment_reference && (
                                            <div className="flex items-start">
                                                <span className="text-sm font-medium text-gray-500 w-20">Reference:</span>
                                                <span className="text-sm text-gray-900 break-all">{order.payment_reference}</span>
                                            </div>
                                        )}
                                        <div className="flex items-start">
                                            <span className="text-sm font-medium text-gray-500 w-20">Total:</span>
                                            <span className="text-lg font-semibold text-green-600">₱{Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Special Instructions */}
                            {order.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-gray-400" />
                                        Special Instructions
                                    </h3>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-sm border mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {order.order_items?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.quantity} × ₱{Number(item.price).toFixed(2)}
                                                </p>
                                                {item.notes && (
                                                    <p className="text-xs text-gray-400 italic">Note: {item.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-medium text-gray-900">₱{Number(item.total_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Next Steps for Guests */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-3">What's Next?</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            {order.payment_method === 'qr' ? (
                                <>
                                    <p>• We've received your payment proof and will verify it shortly</p>
                                    <p>• You'll receive a confirmation call/SMS once payment is approved</p>
                                    <p>• We'll then prepare your order for {order.pickup_or_delivery}</p>
                                </>
                            ) : (
                                <>
                                    <p>• Your order has been confirmed and we'll start preparing it</p>
                                    <p>• You'll receive updates via phone/SMS</p>
                                    <p>• Please prepare exact change for {order.pickup_or_delivery}</p>
                                </>
                            )}
                            <p>• <strong>Keep this order number for reference: #{order.id}</strong></p>
                            <p>• You can track this order using your order number and email</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Continue Shopping
                        </Link>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Print Order
                        </button>
                    </div>
                </div>
            </div>
        </ShopFrontLayout>
    );
}
