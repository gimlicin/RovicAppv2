import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ShopFrontLayout from '@/layouts/shop-front-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { QrCode, Upload, CreditCard, Truck, MapPin, Calendar, Phone, Mail, User, FileImage } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
const route = (window as any).route || ((name: string) => name);

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

interface CheckoutProps {
    cartItems: CartItem[];
    total: number;
}

export default function Checkout({ cartItems, total }: CheckoutProps) {
    const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('qr');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
    const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);

    const { data, setData, post, processing, errors } = useForm({
        pickup_or_delivery: 'pickup',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        scheduled_date: '',
        notes: '',
        cart_items: cartItems,
        payment_method: 'qr',
        payment_proof: null as File | null,
        is_senior_citizen: false,
    });

    // Calculate senior discount (20% as mandated by RA 9994)
    const SENIOR_DISCOUNT_RATE = 0.20;
    const discountAmount = isSeniorCitizen ? total * SENIOR_DISCOUNT_RATE : 0;
    const finalTotal = total - discountAmount;

    const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentProof(file);
            setData('payment_proof', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPaymentProofPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePaymentProof = () => {
        setPaymentProof(null);
        setPaymentProofPreview(null);
        setData('payment_proof', null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('orders.store'));
    };

    return (
        <ShopFrontLayout>
            <Head title="Checkout - Rovic Meatshop" />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                        <p className="text-gray-600 mt-2">Complete your order details and payment</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Delivery & Payment */}
                        <div className="lg:col-span-2">
                            {/* Delivery Options */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="h-5 w-5" />
                                        Delivery Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="pickup"
                                                name="delivery-option"
                                                value="pickup"
                                                checked={data.pickup_or_delivery === 'pickup'}
                                                onChange={(e) => setData('pickup_or_delivery', 'pickup')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <Label htmlFor="pickup" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Store Pickup
                                            </Label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="delivery"
                                                name="delivery-option"
                                                value="delivery"
                                                checked={data.pickup_or_delivery === 'delivery'}
                                                onChange={(e) => setData('pickup_or_delivery', 'delivery')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <Label htmlFor="delivery" className="flex items-center gap-2">
                                                <Truck className="h-4 w-4" />
                                                Home Delivery
                                            </Label>
                                        </div>
                                    </div>

                                    {data.pickup_or_delivery === 'delivery' && (
                                        <div>
                                            <Label htmlFor="delivery-address" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Delivery Address *
                                            </Label>
                                            <textarea
                                                id="delivery-address"
                                                value={data.delivery_address}
                                                onChange={(e) => setData('delivery_address', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows={3}
                                                placeholder="Enter your complete delivery address"
                                            />
                                            {errors.delivery_address && (
                                                <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Method Selection */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <QrCode className="h-5 w-5" />
                                        Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="qr-payment"
                                                name="payment-method"
                                                value="qr"
                                                checked={paymentMethod === 'qr'}
                                                onChange={(e) => {
                                                    setPaymentMethod('qr');
                                                    setData('payment_method', 'qr');
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <Label htmlFor="qr-payment" className="flex items-center gap-2">
                                                <QrCode className="h-4 w-4" />
                                                QR Code Payment
                                            </Label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="cash-payment"
                                                name="payment-method"
                                                value="cash"
                                                checked={paymentMethod === 'cash'}
                                                onChange={(e) => {
                                                    setPaymentMethod('cash');
                                                    setData('payment_method', 'cash');
                                                }}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <Label htmlFor="cash-payment" className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Cash on Delivery/Pickup
                                            </Label>
                                        </div>
                                    </div>

                                    {paymentMethod === 'qr' && (
                                        <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                            <div className="bg-gray-100 rounded-lg p-8 mb-4">
                                                <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-4" />
                                                <p className="text-sm text-gray-500">QR Code Placeholder</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Scan this QR code with your mobile banking app
                                                </p>
                                            </div>
                                            
                                            <Alert className="mb-4">
                                                <FileImage className="h-4 w-4" />
                                                <AlertDescription>
                                                    After payment, please upload your payment proof below
                                                </AlertDescription>
                                            </Alert>

                                            {/* Payment Proof Upload */}
                                            <div className="space-y-3">
                                                <Label htmlFor="payment-proof" className="text-sm font-medium">
                                                    Upload Payment Proof *
                                                </Label>
                                                
                                                {!paymentProofPreview ? (
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                                                        <input
                                                            type="file"
                                                            id="payment-proof"
                                                            accept="image/*"
                                                            onChange={handlePaymentProofChange}
                                                            className="hidden"
                                                        />
                                                        <Label 
                                                            htmlFor="payment-proof" 
                                                            className="cursor-pointer flex flex-col items-center gap-2"
                                                        >
                                                            <Upload className="h-8 w-8 text-gray-400" />
                                                            <span className="text-sm text-gray-600">
                                                                Click to upload payment screenshot
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                PNG, JPG up to 10MB
                                                            </span>
                                                        </Label>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <img
                                                            src={paymentProofPreview}
                                                            alt="Payment proof"
                                                            className="w-full h-32 object-cover rounded-lg border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={removePaymentProof}
                                                            className="absolute top-2 right-2"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                                
                                                {errors.payment_proof && (
                                                    <p className="text-red-500 text-sm">{errors.payment_proof}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary & Customer Info */}
                        <div className="lg:col-span-1">
                            {/* Order Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm">{item.product.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                                                </p>
                                                {item.notes && (
                                                    <p className="text-xs text-blue-600 mt-1">Note: {item.notes}</p>
                                                )}
                                            </div>
                                            <span className="font-medium">₱{item.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    
                                    <Separator />
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Subtotal</span>
                                            <span>₱{total.toFixed(2)}</span>
                                        </div>
                                        
                                        {isSeniorCitizen && (
                                            <div className="flex justify-between items-center text-sm text-green-600">
                                                <span>Senior Citizen Discount (20%)</span>
                                                <span>-₱{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        <Separator />
                                        
                                        <div className="flex justify-between items-center font-bold text-lg">
                                            <span>Total</span>
                                            <span className="text-orange-600">₱{finalTotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {isSeniorCitizen && (
                                            <Alert className="mt-3 bg-amber-50 border-amber-200">
                                                <AlertDescription className="text-xs text-amber-800">
                                                    📋 <strong>Important:</strong> Please present valid Senior Citizen ID upon delivery/pickup for verification.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                {/* Customer Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="customer-name" className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Full Name *
                                                </Label>
                                                <Input
                                                    id="customer-name"
                                                    type="text"
                                                    value={data.customer_name}
                                                    onChange={(e) => setData('customer_name', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className="mt-1"
                                                />
                                                {errors.customer_name && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="customer-phone" className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    Phone Number (11 digits) *
                                                </Label>
                                                <Input
                                                    id="customer-phone"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    value={data.customer_phone}
                                                    onChange={(e) => {
                                                        // Allow digits only, limit to 11
                                                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                                                        setData('customer_phone', value);
                                                    }}
                                                    placeholder="09XXXXXXXXX"
                                                    className="mt-1"
                                                    pattern="[0-9]{11}"
                                                    title="Phone number must be exactly 11 digits."
                                                />
                                                {errors.customer_phone && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="customer-email" className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Email Address
                                                </Label>
                                                <Input
                                                    id="customer-email"
                                                    type="email"
                                                    value={data.customer_email}
                                                    onChange={(e) => setData('customer_email', e.target.value)}
                                                    placeholder="your@email.com"
                                                    className="mt-1"
                                                />
                                                {errors.customer_email && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.customer_email}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="scheduled-date" className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Preferred Date
                                                </Label>
                                                <Input
                                                    id="scheduled-date"
                                                    type="datetime-local"
                                                    value={data.scheduled_date}
                                                    onChange={(e) => setData('scheduled_date', e.target.value)}
                                                    className="mt-1"
                                                />
                                                {errors.scheduled_date && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.scheduled_date}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Senior Citizen Discount */}
                                        <div className="pt-4 border-t">
                                            <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <input
                                                    type="checkbox"
                                                    id="senior-citizen"
                                                    checked={isSeniorCitizen}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setIsSeniorCitizen(checked);
                                                        setData('is_senior_citizen', checked);
                                                    }}
                                                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                                                />
                                                <div className="flex-1">
                                                    <Label htmlFor="senior-citizen" className="cursor-pointer font-semibold text-gray-900">
                                                        Senior Citizen / PWD Discount (20%)
                                                    </Label>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        As mandated by RA 9994 (Expanded Senior Citizens Act). Valid Senior Citizen ID or PWD ID must be presented upon delivery/pickup.
                                                    </p>
                                                    {isSeniorCitizen && (
                                                        <div className="mt-2 p-2 bg-white rounded border border-amber-300">
                                                            <p className="text-xs font-medium text-amber-800">
                                                                ✓ 20% discount will be applied ({discountAmount.toFixed(2)} savings)
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Special Instructions</Label>
                                            <textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows={3}
                                                placeholder="Any special instructions for your order..."
                                            />
                                            {errors.notes && (
                                                <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing || (paymentMethod === 'qr' && !paymentProof)}
                                        className="px-8"
                                    >
                                        {processing ? 'Processing...' : 'Place Order'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ShopFrontLayout>
    );
}
