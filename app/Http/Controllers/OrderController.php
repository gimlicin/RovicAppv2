<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Mail\NewOrderNotification;
use App\Mail\OrderConfirmation;
use App\Mail\OrderStatusUpdated;
use App\Mail\PaymentApproved;
use App\Mail\PaymentRejected;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Notification;
use App\Models\User;
use App\Models\PaymentSetting;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\OrdersExport;

class OrderController extends Controller
{
    /**
     * Display a listing of orders (Admin view)
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'orderItems.product'])
            ->orderBy('created_at', 'desc');
        if ($request->has('status') && $request->status) {
            $query->byStatus($request->status);
        }

        // Filter by delivery type
        if ($request->has('delivery_type') && $request->delivery_type) {
            if ($request->delivery_type === 'pickup') {
                $query->forPickup();
            } elseif ($request->delivery_type === 'delivery') {
                $query->forDelivery();
            }
        }

        // Filter bulk orders
        if ($request->has('bulk_orders') && $request->bulk_orders) {
            $query->bulkOrders();
        }

        $orders = $query->paginate(15);

        // Add allowed status transitions for each order
        $orders->through(function ($order) {
            $order->next_status_options = $order->getNextStatusOptions();
            $order->can_be_cancelled = $order->canBeCancelled();
            $order->is_final_status = $order->isFinalStatus();
            return $order;
        });

        return Inertia::render('Admin/Orders/Index', [
            'orders' => [
                'data' => $orders->items(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'links' => $orders->linkCollection()->toArray(),
            ],
            'filters' => $request->only(['status', 'delivery_type', 'bulk_orders'])
        ]);
    }

    /**
     * Display customer's order history
     */
    public function customerOrders(Request $request)
    {
        $user = Auth::user();
        
        $query = Order::with(['orderItems.product'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc');
        
        $orders = $query->paginate(10);

        return Inertia::render('customer/orders/index', [
            'orders' => $orders
        ]);
    }

    /**
     * Show the checkout form
     */
    public function create(Request $request)
    {
        // Get cart items from session or request
        $cartItems = $request->input('cart_items', []);
        
        if (empty($cartItems)) {
            return redirect()->route('home')
                ->with('error', 'Your cart is empty!');
        }

        // Calculate totals
        $total = 0;
        $processedItems = [];

        foreach ($cartItems as $item) {
            // Handle both array and object formats
            $productId = is_array($item) ? ($item['product_id'] ?? null) : ($item->product_id ?? null);
            $quantity = (int) (is_array($item) ? ($item['quantity'] ?? 1) : ($item->quantity ?? 1));
            $notes = is_array($item) ? ($item['notes'] ?? null) : ($item->notes ?? null);
            
            if ($productId) {
                $product = Product::find($productId);
                if ($product) {
                    $itemTotal = $product->price * $quantity;
                    $total += $itemTotal;
                    
                    $processedItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                        'price' => $product->price,
                        'total' => $itemTotal,
                        'notes' => $notes
                    ];
                }
            }
        }

        // Get active payment settings
        $paymentSettings = PaymentSetting::active()
            ->ordered()
            ->get()
            ->map(function ($setting) {
                return [
                    'id' => $setting->id,
                    'payment_method' => $setting->payment_method,
                    'payment_method_name' => $setting->payment_method_name,
                    'qr_code_url' => $setting->qr_code_url,
                    'account_name' => $setting->account_name,
                    'account_number' => $setting->account_number,
                    'instructions' => $setting->instructions,
                ];
            });

        return Inertia::render('checkout-simple', [
            'cartItems' => $processedItems,
            'total' => $total,
            'paymentSettings' => $paymentSettings
        ]);
    }

    /**
     * Store a new order
     */
    public function store(StoreOrderRequest $request)
    {
        \Log::info('Order submission attempt', [
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);
        
        $validated = $request->validated();
        
        \Log::info('Order validation passed', [
            'validated_data' => $validated
        ]);

        DB::beginTransaction();

        try {
            // Calculate total price and validate stock with row locking for concurrency
            $totalPrice = 0;
            $orderItemsData = [];
            $stockReservations = [];

            foreach ($validated['cart_items'] as $item) {
                // Lock the product row to prevent race conditions
                $product = Product::lockForUpdate()->find($item['product_id']);
                
                if (!$product) {
                    throw new \Exception("Product with ID {$item['product_id']} not found.");
                }

                // Check if product can fulfill the requested quantity
                if (!$product->canFulfillQuantity($item['quantity'])) {
                    $maxOrderable = $product->getMaxOrderableQuantity();
                    throw new \Exception("Cannot order {$item['quantity']} of {$product->name}. Maximum available: {$maxOrderable}");
                }

                // Reserve stock for this order
                if (!$product->reserveStock($item['quantity'])) {
                    throw new \Exception("Failed to reserve stock for {$product->name}");
                }

                $stockReservations[] = [
                    'product' => $product,
                    'quantity' => $item['quantity']
                ];

                $itemTotal = $product->price * $item['quantity'];
                $totalPrice += $itemTotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total_price' => $itemTotal,
                    'notes' => $item['notes'] ?? null
                ];
            }

            // Calculate senior citizen discount if applicable
            $isSeniorDiscount = $validated['is_senior_citizen'] ?? false;
            $discountAmount = 0;
            $discountType = null;
            $finalTotal = $totalPrice;

            if ($isSeniorDiscount) {
                $discountAmount = Order::calculateSeniorDiscount($totalPrice);
                $discountType = Order::DISCOUNT_SENIOR_CITIZEN;
                $finalTotal = $totalPrice - $discountAmount;
            }

            // Handle payment proof upload if QR payment
            $paymentProofPath = null;
            $paymentStatus = Order::PAYMENT_STATUS_PENDING;
            $orderStatus = Order::STATUS_PENDING;

            if ($validated['payment_method'] === Order::PAYMENT_QR) {
                if ($request->hasFile('payment_proof')) {
                    $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');
                    $paymentStatus = Order::PAYMENT_STATUS_SUBMITTED;
                    $orderStatus = Order::STATUS_PAYMENT_SUBMITTED;
                }
            } else {
                // Cash payment - deduct stock immediately and confirm order
                foreach ($stockReservations as $reservation) {
                    $reservation['product']->deductStock($reservation['quantity']);
                }
                $paymentStatus = Order::PAYMENT_STATUS_APPROVED;
                $orderStatus = Order::STATUS_CONFIRMED;
            }

            // Create the order
            $orderData = [
                'user_id' => auth()->id(), // Will be null for guest orders
                'status' => $orderStatus,
                'total_amount' => $finalTotal,
                'pickup_or_delivery' => $validated['pickup_or_delivery'],
                'notes' => $validated['notes'] ?? null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'scheduled_date' => $validated['scheduled_date'] ?? null,
                'is_bulk_order' => $validated['is_bulk_order'] ?? false,
                'payment_method' => $validated['payment_method'],
                'payment_proof_path' => $paymentProofPath,
                'payment_status' => $paymentStatus,
                'payment_submitted_at' => $paymentProofPath ? now() : null,
                'is_senior_discount' => $isSeniorDiscount,
                'discount_type' => $discountType,
                'discount_amount' => $discountAmount,
                'senior_id_verified' => false, // Will be verified upon delivery
                'verification_notes' => $isSeniorDiscount ? 'Awaiting Senior Citizen ID verification upon delivery' : null,
            ];
            
            $order = Order::create($orderData);

            // Create order items
            foreach ($orderItemsData as $itemData) {
                $order->orderItems()->create($itemData);
            }

            // Clear the cart after successful order
            if (auth()->check()) {
                // Clear authenticated user's cart
                CartItem::where('user_id', auth()->id())->delete();
            } else {
                // Clear guest cart by session ID
                $sessionId = $request->session()->getId();
                if ($sessionId) {
                    CartItem::where('session_id', $sessionId)->delete();
                }
            }

            // Send email notifications asynchronously to prevent crashes
            // Send customer confirmation email
            try {
                if ($order->customer_email) {
                    \Log::info('Queuing customer confirmation email', ['order_id' => $order->id, 'to' => $order->customer_email]);
                    // Queue email instead of sending immediately to prevent timeouts
                    // Mail::to($order->customer_email)->queue(new OrderConfirmation($order));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to queue customer confirmation email', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Send admin notification email
            try {
                $adminEmails = User::where('role', User::ROLE_ADMIN)->pluck('email');
                if ($adminEmails->isNotEmpty()) {
                    \Log::info('Queuing admin notification email', ['order_id' => $order->id, 'to' => $adminEmails->toArray()]);
                    // Queue email instead of sending immediately to prevent timeouts
                    // Mail::to($adminEmails->toArray())->queue(new NewOrderNotification($order));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to queue admin notification email', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            \Log::info('Order created successfully', [
                'order_id' => $order->id,
                'user_id' => auth()->id(),
                'total_amount' => $order->total_amount
            ]);

            // Commit the transaction
            DB::commit();

            \Log::info('Database transaction committed successfully', [
                'order_id' => $order->id
            ]);

            // Force reload the order to ensure it exists
            $order = $order->fresh(['orderItems.product']);
            
            if (!$order) {
                \Log::error('Order disappeared after commit', ['order_id' => $order->id ?? 'unknown']);
                throw new \Exception('Order creation verification failed');
            }

            \Log::info('Order verification successful, redirecting to confirmation', [
                'order_id' => $order->id,
                'confirmation_route' => route('order.confirmation', $order)
            ]);

            // Redirect to a GET route that shows the confirmation
            return redirect()->route('order.confirmation', $order)
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            
            \Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'order_data' => $validated ?? []
            ]);
            
            // Redirect back to checkout with error message
            return redirect()->back()
                ->withErrors(['order' => 'Order creation failed: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display order confirmation page (for both authenticated and guest users)
     */
    public function confirmation(Order $order)
    {
        \Log::info('Order confirmation method reached', [
            'order_id' => $order->id,
            'user_id' => auth()->id()
        ]);
        
        // Load related data
        $order->load(['orderItems.product']);
        
        \Log::info('Order confirmation page accessed', [
            'order_id' => $order->id,
            'user_id' => auth()->id(),
            'order_data' => $order->toArray()
        ]);

        return Inertia::render('order-confirmation', [
            'order' => $order,
            'success' => session('success', 'Order placed successfully!')
        ]);
    }

    /**
     * Display the specified order
     */
    public function show(Order $order)
    {
        // Check if user can view this order
        if (auth()->check()) {
            if (!auth()->user()->isAdmin() && $order->user_id !== auth()->id()) {
                abort(403);
            }
        } else {
            // For guest orders, redirect to tracking page
            return redirect()->route('orders.track')
                ->with('info', 'Please enter your order details to track your order.');
        }

        $order->load(['user', 'orderItems.product.category']);

        return Inertia::render('orders/show', [
            'order' => $order
        ]);
    }

    /**
     * Show guest order tracking form
     */
    public function trackOrderForm()
    {
        return Inertia::render('orders/track');
    }

    /**
     * Track order for guest users
     */
    public function trackOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'customer_email' => 'required_without:customer_phone|nullable|email',
            'customer_phone' => 'required_without:customer_email|nullable|string',
        ], [
            'order_id.required' => 'Please enter your order ID.',
            'order_id.exists' => 'Order not found.',
            'customer_email.required_without' => 'Please enter either email or phone number.',
            'customer_phone.required_without' => 'Please enter either email or phone number.',
        ]);

        // Find order matching the criteria
        $query = Order::where('id', $validated['order_id']);

        if (!empty($validated['customer_email'])) {
            $query->where('customer_email', $validated['customer_email']);
        } elseif (!empty($validated['customer_phone'])) {
            $query->where('customer_phone', $validated['customer_phone']);
        }

        $order = $query->first();

        if (!$order) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Order not found. Please check your order ID and contact information.');
        }

        // Load relationships
        $order->load(['user', 'orderItems.product.category']);

        return Inertia::render('orders/show', [
            'order' => $order,
            'isGuestView' => true
        ]);
    }

    /**
     * Update order status (Admin only)
     */
    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,awaiting_payment,payment_submitted,payment_approved,payment_rejected,confirmed,preparing,ready,ready_for_pickup,ready_for_delivery,completed,cancelled'
        ]);

        $newStatus = $validated['status'];

        // Validate status transition
        if (!$order->canTransitionTo($newStatus)) {
            return redirect()->back()
                ->with('error', "Cannot transition from '{$order->status}' to '{$newStatus}'. Invalid status transition.");
        }

        DB::beginTransaction();

        try {
            // Handle specific status transitions
            switch ($newStatus) {
                case Order::STATUS_CONFIRMED:
                    // For cash orders, mark as confirmed
                    if ($order->payment_method === Order::PAYMENT_CASH) {
                        $order->update([
                            'status' => $newStatus,
                            'payment_status' => Order::PAYMENT_STATUS_APPROVED,
                        ]);
                    } else {
                        $order->update(['status' => $newStatus]);
                    }
                    break;

                case Order::STATUS_PREPARING:
                    // Order is now being prepared
                    $order->update(['status' => $newStatus]);
                    
                    $message = "Your order is now being prepared with care. We'll notify you when it's ready!";
                    
                    // Create notification
                    if ($order->user_id) {
                        Notification::createPaymentNotification(
                            $order,
                            'Order Being Prepared',
                            "Your order #{$order->id} is now being prepared!"
                        );
                    }
                    
                    // Send email
                    if ($order->customer_email) {
                        Mail::to($order->customer_email)->send(new OrderStatusUpdated($order, $message));
                    }
                    break;

                case Order::STATUS_READY:
                    // Order is ready for pickup/delivery (backward compatibility)
                    $order->update(['status' => $newStatus]);
                    
                    $deliveryType = ucfirst($order->pickup_or_delivery);
                    $message = "Great news! Your order is ready for {$deliveryType}. " . 
                               ($order->pickup_or_delivery === 'delivery' ? 'Expect delivery soon!' : 'Please come pick it up at your convenience.');
                    
                    // Create notification
                    if ($order->user_id) {
                        Notification::createPaymentNotification(
                            $order,
                            "Order Ready for {$deliveryType}",
                            "Your order #{$order->id} is ready for {$deliveryType}!"
                        );
                    }
                    
                    // Send email
                    if ($order->customer_email) {
                        Mail::to($order->customer_email)->send(new OrderStatusUpdated($order, $message));
                    }
                    break;

                case Order::STATUS_READY_FOR_PICKUP:
                    // Order is ready for customer pickup
                    $order->update(['status' => $newStatus]);
                    
                    $message = "Great news! Your order is ready for pickup. Please visit our store at your convenience to collect your items. Don't forget to bring your order ID: #{$order->id}";
                    
                    // Create notification
                    if ($order->user_id) {
                        Notification::createPaymentNotification(
                            $order,
                            "Order Ready for Pickup",
                            "Your order #{$order->id} is ready for pickup at our store!"
                        );
                    }
                    
                    // Send email
                    if ($order->customer_email) {
                        Mail::to($order->customer_email)->send(new OrderStatusUpdated($order, $message));
                    }
                    break;

                case Order::STATUS_READY_FOR_DELIVERY:
                    // Order is ready for delivery
                    $order->update(['status' => $newStatus]);
                    
                    $message = "Great news! Your order is ready for delivery. Our delivery team will contact you shortly to arrange the delivery time. Please ensure someone is available to receive the order.";
                    
                    // Create notification
                    if ($order->user_id) {
                        Notification::createPaymentNotification(
                            $order,
                            "Order Ready for Delivery", 
                            "Your order #{$order->id} is ready for delivery!"
                        );
                    }
                    
                    // Send email
                    if ($order->customer_email) {
                        Mail::to($order->customer_email)->send(new OrderStatusUpdated($order, $message));
                    }
                    break;

                case Order::STATUS_COMPLETED:
                    // Order is completed
                    $order->update(['status' => $newStatus]);
                    
                    $message = "Thank you for your purchase! Your order has been completed. We hope you enjoy our products and look forward to serving you again!";
                    
                    // Create notification
                    if ($order->user_id) {
                        Notification::createPaymentNotification(
                            $order,
                            'Order Completed',
                            "Your order #{$order->id} has been completed. Thank you!"
                        );
                    }
                    
                    // Send email
                    if ($order->customer_email) {
                        Mail::to($order->customer_email)->send(new OrderStatusUpdated($order, $message));
                    }
                    break;

                case Order::STATUS_CANCELLED:
                    // Order is cancelled - this should use the cancel method instead
                    return redirect()->back()
                        ->with('error', 'Please use the cancel button to cancel orders.');

                default:
                    $order->update(['status' => $newStatus]);
                    break;
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Order status updated successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            
            \Log::error('Order status update failed', [
                'order_id' => $order->id,
                'current_status' => $order->status,
                'new_status' => $newStatus,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('error', 'Failed to update order status: ' . $e->getMessage());
        }
    }

    /**
     * Approve payment proof (Admin only)
     */
    public function approvePayment(Order $order)
    {
        if (!$order->isPaymentSubmitted()) {
            return redirect()->back()
                ->with('error', 'Payment has not been submitted yet.');
        }

        DB::beginTransaction();

        try {
            // Deduct stock from reserved quantities
            foreach ($order->orderItems as $orderItem) {
                $product = Product::lockForUpdate()->find($orderItem->product_id);
                
                if ($product && $product->track_stock) {
                    // Deduct from actual stock and reduce reserved stock
                    if (!$product->deductStock($orderItem->quantity)) {
                        throw new \Exception("Insufficient stock for {$product->name}");
                    }
                }
            }

            $order->update([
                'payment_status' => Order::PAYMENT_STATUS_APPROVED,
                'status' => Order::STATUS_PAYMENT_APPROVED,
                'payment_approved_at' => now(),
                'payment_approved_by' => auth()->id(),
                'payment_rejection_reason' => null,
            ]);

            // Create notification for the customer
            if ($order->user_id) {
                Notification::createPaymentNotification(
                    $order,
                    'Payment Approved',
                    "Your payment for order #{$order->id} has been approved! Your order is now being prepared."
                );
            }

            DB::commit();

            // Send payment approved email
            try {
                if ($order->customer_email) {
                    Mail::to($order->customer_email)->send(new PaymentApproved($order));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send payment approved email', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return redirect()->back()
                ->with('success', 'Payment approved and stock updated successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()->back()
                ->with('error', 'Failed to approve payment: ' . $e->getMessage());
        }
    }

    /**
     * Reject payment proof (Admin only)
     */
    public function rejectPayment(Request $request, Order $order)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        if (!$order->isPaymentSubmitted()) {
            return redirect()->back()
                ->with('error', 'Payment has not been submitted yet.');
        }

        DB::beginTransaction();

        try {
            // Release reserved stock back to available inventory
            foreach ($order->orderItems as $orderItem) {
                $product = Product::lockForUpdate()->find($orderItem->product_id);
                
                if ($product && $product->track_stock) {
                    $product->releaseStock($orderItem->quantity);
                }
            }

            $order->update([
                'payment_status' => Order::PAYMENT_STATUS_REJECTED,
                'status' => Order::STATUS_PAYMENT_REJECTED,
                'payment_rejection_reason' => $validated['rejection_reason'],
                'payment_approved_at' => null,
                'payment_approved_by' => null,
            ]);

            // Create notification for the customer
            if ($order->user_id) {
                Notification::createPaymentNotification(
                    $order,
                    'Payment Rejected',
                    "Your payment for order #{$order->id} has been rejected. Reason: {$validated['rejection_reason']}. Please submit a new payment proof."
                );
            }

            DB::commit();

            // Send payment rejected email
            try {
                if ($order->customer_email) {
                    Mail::to($order->customer_email)->send(new PaymentRejected($order, $validated['rejection_reason']));
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send payment rejected email', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return redirect()->back()
                ->with('success', 'Payment rejected and stock released successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()->back()
                ->with('error', 'Failed to reject payment: ' . $e->getMessage());
        }
    }

    /**
     * View payment proof (Admin only)
     */
    public function viewPaymentProof(Order $order)
    {
        if (!$order->payment_proof_path) {
            abort(404, 'Payment proof not found.');
        }

        $path = storage_path('app/public/' . $order->payment_proof_path);
        
        if (!file_exists($path)) {
            abort(404, 'Payment proof file not found.');
        }

        return response()->file($path);
    }

    /**
     * Cancel an order
     */
    public function cancel(Order $order)
    {
        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_PAYMENT_SUBMITTED, Order::STATUS_PAYMENT_REJECTED])) {
            return redirect()->back()
                ->with('error', 'Cannot cancel order with status: ' . $order->status);
        }

        // Check if user can cancel this order
        if (!auth()->user()->isAdmin() && $order->user_id !== auth()->id()) {
            abort(403);
        }

        DB::beginTransaction();

        try {
            // Release reserved stock if order hasn't been approved yet
            if (in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_PAYMENT_SUBMITTED, Order::STATUS_PAYMENT_REJECTED])) {
                foreach ($order->orderItems as $orderItem) {
                    $product = Product::lockForUpdate()->find($orderItem->product_id);
                    
                    if ($product && $product->track_stock) {
                        $product->releaseStock($orderItem->quantity);
                    }
                }
            }

            $order->update(['status' => Order::STATUS_CANCELLED]);

            DB::commit();

            return redirect()->back()
                ->with('success', 'Order cancelled and stock released successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()->back()
                ->with('error', 'Failed to cancel order: ' . $e->getMessage());
        }
    }

    /**
     * Reorder - create new order from existing order
     */
    public function reorder(Order $order)
    {
        // Check if user can reorder
        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        $cartItems = [];
        foreach ($order->orderItems as $item) {
            $cartItems[] = [
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'notes' => $item->notes
            ];
        }

        return redirect()->route('orders.create', ['cart_items' => $cartItems]);
    }

    /**
     * Bulk order form for wholesalers
     */
    public function bulkOrderForm()
    {
        return Inertia::render('orders/bulk-order');
    }

    /**
     * Export orders to Excel/CSV
     */
    public function exportOrders(Request $request)
    {
        $query = Order::with(['user', 'orderItems.product'])
            ->orderBy('created_at', 'desc');

        // Apply filters - match index method logic
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->byStatus($request->status);
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->has('delivery_type') && $request->delivery_type && $request->delivery_type !== 'all') {
            if ($request->delivery_type === 'pickup') {
                $query->forPickup();
            } elseif ($request->delivery_type === 'delivery') {
                $query->forDelivery();
            }
        }

        if ($request->has('bulk_orders') && $request->bulk_orders) {
            $query->bulkOrders();
        }

        $orders = $query->get();

        \Log::info('Export orders count: ' . $orders->count());

        // Transform data for export
        $exportData = $orders->map(function ($order) {
            return [
                'Order ID' => $order->order_number ?? $order->id,
                'Customer' => $order->customer_name ?: ($order->user->name ?? 'Guest'),
                'Email' => $order->customer_email ?: ($order->user->email ?? 'N/A'),
                'Phone' => $order->customer_phone ?: 'N/A',
                'Status' => ucfirst($order->status),
                'Payment Status' => ucfirst($order->payment_status),
                'Payment Method' => ucfirst($order->payment_method),
                'Delivery Type' => $order->pickup_or_delivery === 'delivery' ? 'Delivery' : 'Pickup',
                'Total Amount' => $order->total_price,
                'Items Count' => $order->orderItems->count(),
                'Is Bulk Order' => $order->is_bulk_order ? 'Yes' : 'No',
                'Senior/PWD Discount' => $order->is_senior_citizen ? 'Yes' : 'No',
                'Order Date' => $order->created_at->format('Y-m-d H:i:s'),
            ];
        })->toArray();

        $filename = 'orders_' . now()->format('Y-m-d_His') . '.xlsx';
        $filePath = storage_path('app/temp/' . $filename);
        
        // Ensure temp directory exists
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        // Use custom export with styling
        $export = new OrdersExport($exportData);
        $export->export($filePath);

        return response()->download($filePath, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Generate PDF invoice for an order
     */
    public function generateInvoice(Order $order)
    {
        // Load relationships
        $order->load(['user', 'orderItems.product']);

        // Generate PDF
        $pdf = Pdf::loadView('invoices.order', compact('order'));

        $filename = 'invoice_' . $order->order_number . '.pdf';

        return $pdf->download($filename);
    }
}
