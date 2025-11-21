import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import ShopFrontLayout from '@/layouts/shop-front-layout';
import axios from 'axios';

interface CartItem {
    product: {
        id: number;
        name: string;
        price: number;
        image_url?: string;
    };
    quantity: number;
    price: number;
    total: number;
    notes?: string;
}

interface PaymentSetting {
    id: number;
    payment_method: string;
    payment_method_name: string;
    qr_code_url: string | null;
    account_name: string | null;
    account_number: string | null;
    instructions: string | null;
}

interface CheckoutProps {
    cartItems: CartItem[];
    total: number;
    paymentSettings: PaymentSetting[];
}

export default function CheckoutSimple({ cartItems, total, paymentSettings = [] }: CheckoutProps) {
    const { props } = usePage<any>();
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null); // Default to cash (null)
    const [showInstructions, setShowInstructions] = useState<boolean>(false);

    // Calculate senior discount (5% discount)
    const SENIOR_DISCOUNT_RATE = 0.05;
    const discountAmount = isSeniorCitizen ? total * SENIOR_DISCOUNT_RATE : 0;
    const finalTotal = total - discountAmount;

    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        notes: '',
        payment_method: 'cash', // Default to cash payment
        payment_proof: null as File | null,
        cart_items: [] as any[],
        pickup_or_delivery: 'pickup',
        delivery_address: '',
        delivery_city: '',
        delivery_barangay: '',
        delivery_instructions: '',
        is_bulk_order: false as boolean,
        is_senior_citizen: false as boolean,
        terms_accepted: false as boolean,
    });

    const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentProof(file);
            setData('payment_proof', file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Debug logging
        console.log('Form submission attempt:', {
            payment_method: data.payment_method,
            terms_accepted: data.terms_accepted,
            selectedPaymentMethod,
            paymentSettings,
            paymentProof
        });
        
        // Prepare cart items data
        const formattedCartItems = cartItems.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            notes: item.notes || null
        }));
        
        // Prepare complete form data with cart items
        const submitData = {
            ...data,
            cart_items: formattedCartItems,
            delivery_address: data.pickup_or_delivery === 'delivery' ? data.delivery_address : '',
            delivery_barangay: data.pickup_or_delivery === 'delivery' ? data.delivery_barangay : '',
            delivery_city: data.pickup_or_delivery === 'delivery' ? data.delivery_city : '',
            delivery_instructions: data.pickup_or_delivery === 'delivery' ? data.delivery_instructions : '',
            customer_email: data.customer_email || '',
            notes: data.notes || '',
            _token: props.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '', // Fresh CSRF token from Inertia props
        };
        
        // Back to normal orders route with working OrderController
        router.post('/orders', submitData, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => {
                console.error('Order submission errors:', errors);
                // More professional error handling
                const errorMsg = typeof errors === 'object' && errors.message 
                    ? errors.message 
                    : 'Unable to process your order. Please check your information and try again.';
                alert('❌ Order Failed: ' + errorMsg);
            },
            onSuccess: async (response) => {
                console.log('Order submitted successfully:', response);
                
                // Clear cart after successful order
                try {
                    await axios.delete('/api/cart');
                    console.log('Cart cleared successfully');
                } catch (error) {
                    console.warn('Failed to clear cart:', error);
                }
            }
        });
    };

    return (
        <ShopFrontLayout>
            <Head title="Checkout - Rovic Meatshop" />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                    {/* 3-Column Layout - Inspired by The Good Meats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Column 1 - Order Summary */}
                        <div className="md:col-span-1">
                            {/* Order Summary */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-8 max-h-[calc(100vh-100px)] overflow-y-auto">
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span className="text-xl">🛍️</span> Order Summary
                                </h2>
                                
                                {/* Order Items */}
                                <div className="space-y-2 mb-3">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="flex gap-2 py-2 border-b last:border-0">
                                            {/* Product Image */}
                                            {item.product.image_url && (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-12 h-12 object-cover rounded-md"
                                                />
                                            )}
                                            {/* Product Details */}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-xs leading-tight">{item.product.name}</h4>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {item.quantity} × ₱{Number(item.price).toFixed(2)}
                                                </p>
                                                <p className="text-xs font-semibold text-orange-600 mt-0.5">
                                                    ₱{Number(item.total).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Summary Calculations */}
                                <div className="space-y-2 pt-3 border-t">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold">₱{Number(total).toFixed(2)}</span>
                                    </div>
                                    
                                    {isSeniorCitizen && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-600">Senior Discount (5%)</span>
                                            <span className="font-semibold text-green-600">-₱{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    
                                    <div className="border-t pt-2"></div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold">Total</span>
                                        <span className="text-xl font-bold text-orange-600">₱{finalTotal.toFixed(2)}</span>
                                    </div>
                                    
                                    {isSeniorCitizen && (
                                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                                            <p className="text-xs text-amber-800">
                                                📋 <strong>Note:</strong> Present valid ID upon delivery/pickup
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Secure Checkout Badge */}
                                <div className="mt-4 pt-3 border-t">
                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span>Secure Checkout</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End Column 1 */}

                        {/* Column 2 - Delivery & Payment */}
                        <div className="md:col-span-1 space-y-4">
                            {/* Delivery Options */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span className="text-xl">🚚</span> Delivery Options
                                </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                data.pickup_or_delivery === 'pickup' 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="pickup_or_delivery"
                                    value="pickup"
                                    checked={data.pickup_or_delivery === 'pickup'}
                                    onChange={(e) => setData('pickup_or_delivery', e.target.value as 'pickup' | 'delivery')}
                                    className="sr-only"
                                />
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                        data.pickup_or_delivery === 'pickup'
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {data.pickup_or_delivery === 'pickup' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Store Pickup</h3>
                                        <p className="text-sm text-gray-600">Pick up your order at our store</p>
                                        <p className="text-xs text-green-600 font-medium">FREE</p>
                                    </div>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                data.pickup_or_delivery === 'delivery' 
                                    ? 'border-red-500 bg-red-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="pickup_or_delivery"
                                    value="delivery"
                                    checked={data.pickup_or_delivery === 'delivery'}
                                    onChange={(e) => setData('pickup_or_delivery', e.target.value as 'pickup' | 'delivery')}
                                    className="sr-only"
                                />
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                        data.pickup_or_delivery === 'delivery'
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {data.pickup_or_delivery === 'delivery' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Home Delivery</h3>
                                        <p className="text-sm text-gray-600">We'll deliver to your address</p>
                                        <p className="text-xs text-blue-600 font-medium">Delivery fee may apply</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                            </div>

                            {/* QR Code Payment Section */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span className="text-xl">💳</span> Payment Method
                                </h3>
                                
                                {paymentSettings.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Payment Method Selection */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Choose Your Payment Method:</h4>
                                            <div className="space-y-2">
                                                {/* Cash on Delivery Option */}
                                                <label
                                                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                        selectedPaymentMethod === null
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:border-green-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        value="cash"
                                                        checked={selectedPaymentMethod === null}
                                                        onChange={() => {
                                                            setSelectedPaymentMethod(null);
                                                            setData('payment_method', 'cash');
                                                            setPaymentProof(null);
                                                        }}
                                                        className="mr-3 h-5 w-5 text-green-600"
                                                    />
                                                    <span className="text-base font-medium">
                                                        💰 Cash on Delivery / Pickup
                                                    </span>
                                                </label>

                                                {/* QR Payment Options */}
                                                {paymentSettings.map((setting) => (
                                                    <label
                                                        key={setting.id}
                                                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                            selectedPaymentMethod === setting.id
                                                                ? 'border-orange-500 bg-orange-50'
                                                                : 'border-gray-200 hover:border-orange-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="payment_method"
                                                            value={setting.id}
                                                            checked={selectedPaymentMethod === setting.id}
                                                            onChange={() => {
                                                                setSelectedPaymentMethod(setting.id);
                                                                setData('payment_method', setting.payment_method);
                                                            }}
                                                            className="mr-3 h-5 w-5 text-orange-600"
                                                        />
                                                        <span className="text-base font-medium">
                                                            📱 {setting.payment_method_name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Display Selected Payment Method Details */}
                                        {selectedPaymentMethod && paymentSettings.find(s => s.id === selectedPaymentMethod) && (
                                            <div className="border-2 border-orange-300 rounded-lg p-3 bg-orange-50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* QR Code Display */}
                                                    {paymentSettings.find(s => s.id === selectedPaymentMethod)?.qr_code_url && (
                                                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                                            <img
                                                                src={paymentSettings.find(s => s.id === selectedPaymentMethod)?.qr_code_url || ''}
                                                                alt="QR Code"
                                                                className="mx-auto w-48 h-48 object-contain rounded-lg"
                                                            />
                                                            <p className="text-sm text-gray-600 mt-2">Scan to pay</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Account Details */}
                                                    <div className="text-sm space-y-3">
                                                        <p className="font-bold text-orange-900 text-lg mb-3">
                                                            {paymentSettings.find(s => s.id === selectedPaymentMethod)?.payment_method_name}
                                                        </p>
                                                        {paymentSettings.find(s => s.id === selectedPaymentMethod)?.account_name && (
                                                            <div className="mb-2">
                                                                <span className="text-gray-600 font-medium">Account Name:</span>
                                                                <p className="font-semibold text-gray-900 text-base">
                                                                    {paymentSettings.find(s => s.id === selectedPaymentMethod)?.account_name}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {paymentSettings.find(s => s.id === selectedPaymentMethod)?.account_number && (
                                                            <div className="mb-2">
                                                                <span className="text-gray-600 font-medium">Account Number:</span>
                                                                <p className="font-semibold text-gray-900 text-base">
                                                                    {paymentSettings.find(s => s.id === selectedPaymentMethod)?.account_number}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                                                            <p className="text-gray-800 font-medium">
                                                                Amount to Pay: <span className="text-xl font-bold text-orange-600">₱{finalTotal.toFixed(2)}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Collapsible Instructions */}
                                                {paymentSettings.find(s => s.id === selectedPaymentMethod)?.instructions && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowInstructions(!showInstructions)}
                                                        className="mt-2 text-xs text-blue-700 hover:underline"
                                                    >
                                                        {showInstructions ? '▼ Hide' : '▶ Show'} detailed instructions
                                                    </button>
                                                )}
                                                {showInstructions && paymentSettings.find(s => s.id === selectedPaymentMethod)?.instructions && (
                                                    <div className="mt-2 bg-blue-50 p-2 rounded text-xs text-blue-900">
                                                        <p className="whitespace-pre-line">
                                                            {paymentSettings.find(s => s.id === selectedPaymentMethod)?.instructions}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Fallback if no payment settings configured */
                                    <div className="bg-gray-100 p-8 rounded-lg text-center mb-6">
                                        <div className="text-6xl mb-3">📱</div>
                                        <p className="text-lg font-medium text-gray-800 mb-1">QR Code Payment</p>
                                        <p className="text-sm text-gray-600">Payment details will be provided shortly</p>
                                        <p className="text-xs text-gray-500 mt-2">Please upload your payment proof below after making the payment</p>
                                    </div>
                                )}
                                
                                {/* Payment Proof Upload - Only show for non-cash payments */}
                                {data.payment_method !== 'cash' && selectedPaymentMethod !== null && (
                                    <div className="p-5 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <label className="flex items-center gap-2 text-base font-semibold mb-2">
                                            📤 Upload Payment Proof *
                                        </label>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Please upload a screenshot or photo of your payment confirmation
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePaymentProofChange}
                                            className="w-full text-sm p-3 border rounded-lg bg-white"
                                        />
                                        {errors.payment_proof && (
                                            <p className="text-red-500 text-sm mt-1">{errors.payment_proof}</p>
                                        )}
                                        {paymentProof && (
                                            <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                                                ✓ {paymentProof.name}
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                {/* Cash Payment Message */}
                                {data.payment_method === 'cash' && (
                                    <div className="p-5 border-2 border-green-300 rounded-lg bg-green-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">💰</span>
                                            <div>
                                                <h4 className="font-semibold text-green-800">Cash Payment Selected</h4>
                                                <p className="text-sm text-green-700">Payment will be collected upon pickup/delivery</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* End Column 2 */}

                        {/* Column 3 - Customer Info & Place Order */}
                        <div className="md:col-span-1">
                            {/* Customer Form */}
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <span className="text-xl">👤</span> Customer Information
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-3">

                                    <div>
                                        <label className="block text-xs font-medium mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            className="w-full p-2 text-sm border rounded-lg"
                                            placeholder="Enter your full name"
                                        />
                                        {errors.customer_name && (
                                            <p className="text-red-500 text-xs mt-0.5">{errors.customer_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium mb-1">Phone Number * (11 digits)</label>
                                        <input
                                            type="tel"
                                            value={data.customer_phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                setData('customer_phone', value);
                                            }}
                                            className="w-full p-2 text-sm border rounded-lg"
                                            placeholder="09XXXXXXXXX"
                                            maxLength={11}
                                        />
                                        {errors.customer_phone && (
                                            <p className="text-red-500 text-xs mt-0.5">{errors.customer_phone}</p>
                                        )}
                                    </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Email Address (Optional)</label>
                                    <input
                                        type="email"
                                        value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)}
                                        className="w-full p-2 text-sm border rounded-lg"
                                        placeholder="your@email.com"
                                    />
                                    {errors.customer_email && (
                                        <p className="text-red-500 text-xs mt-0.5">{errors.customer_email}</p>
                                    )}
                                </div>

                                {/* Delivery Address Fields */}
                                {data.pickup_or_delivery === 'delivery' && (
                                    <>
                                        <div className="border-t pt-3">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                📍 Delivery Address
                                            </h3>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium mb-1">Street Address *</label>
                                                <input
                                                    type="text"
                                                    value={data.delivery_address}
                                                    onChange={(e) => setData('delivery_address', e.target.value)}
                                                    className="w-full p-2 text-sm border rounded-lg"
                                                    placeholder="House #, Street name"
                                                    required={data.pickup_or_delivery === 'delivery'}
                                                />
                                                {errors.delivery_address && (
                                                    <p className="text-red-500 text-xs mt-0.5">{errors.delivery_address}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">Barangay *</label>
                                                <input
                                                    type="text"
                                                    value={data.delivery_barangay}
                                                    onChange={(e) => setData('delivery_barangay', e.target.value)}
                                                    className="w-full p-2 text-sm border rounded-lg"
                                                    placeholder="Barangay name"
                                                    required={data.pickup_or_delivery === 'delivery'}
                                                />
                                                {errors.delivery_barangay && (
                                                    <p className="text-red-500 text-xs mt-0.5">{errors.delivery_barangay}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">City *</label>
                                                <input
                                                    type="text"
                                                    value={data.delivery_city}
                                                    onChange={(e) => setData('delivery_city', e.target.value)}
                                                    className="w-full p-2 text-sm border rounded-lg"
                                                    placeholder="City name"
                                                    required={data.pickup_or_delivery === 'delivery'}
                                                />
                                                {errors.delivery_city && (
                                                    <p className="text-red-500 text-xs mt-0.5">{errors.delivery_city}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1">Delivery Instructions (Optional)</label>
                                            <textarea
                                                value={data.delivery_instructions}
                                                onChange={(e) => setData('delivery_instructions', e.target.value)}
                                                className="w-full p-2 text-sm border rounded-lg"
                                                rows={2}
                                                placeholder="e.g., Leave at gate, call upon arrival"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Senior Citizen Discount */}
                                <div className="pt-2 border-t">
                                    <div className="flex items-start space-x-1.5 p-1.5 bg-amber-50 rounded border border-amber-200">
                                        <input
                                            type="checkbox"
                                            id="senior-citizen"
                                            checked={isSeniorCitizen}
                                            onChange={(e) => {
                                                setIsSeniorCitizen(e.target.checked);
                                                setData('is_senior_citizen', e.target.checked);
                                            }}
                                            className="mt-0.5 h-4 w-4 rounded border-amber-300"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="senior-citizen" className="cursor-pointer text-xs font-semibold text-gray-900 block">
                                                Senior Citizen / PWD Discount (5%)
                                            </label>
                                            <p className="text-xs text-gray-600">
                                                Valid ID must be presented
                                            </p>
                                            {isSeniorCitizen && (
                                                <p className="text-xs font-semibold text-green-700 mt-1">
                                                    ✓ You'll save ₱{discountAmount.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Special Instructions (Optional)</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full p-2 text-sm border rounded-lg"
                                        rows={2}
                                        placeholder="Any special instructions for your order..."
                                    />
                                </div>

                                {/* Terms and Conditions */}
                                <div className="bg-gray-50 p-2 rounded border">
                                    <div className="mb-2">
                                        <h4 className="text-xs font-semibold text-gray-800 mb-1">Terms and Conditions</h4>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div>
                                                <strong>Return Policy:</strong> Products marked as promotional/promo items are not eligible for returns. All other products may be returned within our standard return window.
                                            </div>
                                            <div>
                                                <strong>Cancellation Policy:</strong> To cancel your order, please contact us directly via:
                                                <ul className="list-disc list-inside ml-2 text-xs">
                                                    <li>Facebook: Rovic Meat Products</li>
                                                    <li>Phone: +63 936 554 3854</li>
                                                    <li>Email: Kxrstynbasan2@gmail.com</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <strong>Delivery Fee:</strong> Customers will shoulder the delivery fee. The final amount may vary depending on delivery location and order size.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            id="terms_accepted"
                                            checked={data.terms_accepted}
                                            onChange={(e) => setData('terms_accepted', e.target.checked)}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-0.5"
                                            required
                                        />
                                        <label htmlFor="terms_accepted" className="ml-2 text-xs text-gray-700">
                                            I have read and agree to the <strong>Terms and Conditions</strong> above.
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || ((data.payment_method !== 'cash' && data.payment_method !== null) && !paymentProof) || !data.terms_accepted}
                                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors shadow-md"
                                >
                                    {processing ? '⏳ Processing Your Order...' : '🛒 Place Order'}
                                </button>
                                
                                {(((data.payment_method !== 'cash' && !paymentProof) || !data.terms_accepted) && (
                                    <div className="text-sm text-gray-500 text-center space-y-1">
                                        {data.payment_method !== 'cash' && !paymentProof && <p>Please upload payment proof to continue</p>}
                                        {!data.terms_accepted && <p>Please accept the terms and conditions to continue</p>}
                                    </div>
                                ))}
                            </form>
                        </div>
                    </div>
                    {/* End Column 3 */}

                </div>
                {/* End 3-Column Grid - Inspired by The Good Meats */}
            </div>
            {/* End max-w-7xl container */}
        </div>
        {/* End Background */}
        </ShopFrontLayout>
    );
}
