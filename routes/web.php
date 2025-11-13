<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public routes
Route::get('/', [ProductController::class, 'home'])->name('home');
Route::get('/products', [ProductController::class, 'catalog'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');

// Cart API routes (uses session, so must be in web.php)
Route::prefix('api/cart')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\CartController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\CartController::class, 'store']);
    Route::put('/{productId}', [\App\Http\Controllers\Api\CartController::class, 'update']);
    Route::delete('/{productId}', [\App\Http\Controllers\Api\CartController::class, 'destroy']);
    Route::delete('/', [\App\Http\Controllers\Api\CartController::class, 'clear']);
    Route::post('/sync-guest', [\App\Http\Controllers\Api\CartController::class, 'syncGuestCart']);
});

// Notification API routes (authenticated users only)
Route::prefix('api/notifications')->middleware(['web', 'auth'])->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::patch('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::patch('/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
});

// Dashboard route for authenticated users
Route::get('/dashboard', function () {
    $user = Auth::user();
    
    if ($user && $user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    
    return redirect()->route('home');
})->middleware(['auth', 'verified'])->name('dashboard');

// Guest checkout routes
Route::get('/checkout', [OrderController::class, 'create'])->name('checkout');
Route::post('/checkout', [OrderController::class, 'create'])->name('checkout.post');
Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

// Order confirmation (accessible to both authenticated and guest users)
Route::get('/order-confirmation/{order}', [OrderController::class, 'confirmation'])->name('order.confirmation');

// Guest order tracking
Route::get('/track-order', [OrderController::class, 'trackOrderForm'])->name('orders.track');
Route::post('/track-order', [OrderController::class, 'trackOrder'])->name('orders.track.submit');

// Customer routes (authenticated)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/my-orders', [OrderController::class, 'customerOrders'])->name('orders.customer');
    Route::post('/orders/{order}/reorder', [OrderController::class, 'reorder'])->name('orders.reorder');
    Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    
    // Bulk orders for wholesalers
    Route::get('/bulk-order', [OrderController::class, 'bulkOrderForm'])
        ->middleware('role:wholesaler,admin')
        ->name('orders.bulk');
});

// Admin Dashboard routes
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])
        ->name('dashboard');
    
    // Order Management
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::patch('/orders/{order}/approve-payment', [OrderController::class, 'approvePayment'])->name('orders.approve-payment');
    Route::patch('/orders/{order}/reject-payment', [OrderController::class, 'rejectPayment'])->name('orders.reject-payment');
    Route::get('/orders/{order}/payment-proof', [OrderController::class, 'viewPaymentProof'])->name('orders.payment-proof');
    
    // Order Export & Reports
    Route::get('/orders/export', [OrderController::class, 'exportOrders'])->name('orders.export');
    Route::get('/orders/{order}/invoice', [OrderController::class, 'generateInvoice'])->name('orders.invoice');
    
    // Product Management
    Route::resource('products', \App\Http\Controllers\Admin\AdminProductController::class);
    Route::patch('/products/{product}/toggle-best-selling', [\App\Http\Controllers\Admin\AdminProductController::class, 'toggleBestSelling'])
        ->name('products.toggle-best-selling');
    Route::patch('/products/{product}/toggle-active', [\App\Http\Controllers\Admin\AdminProductController::class, 'toggleActive'])
        ->name('products.toggle-active');
    
    // Stock Management
    Route::get('/products/low-stock', [\App\Http\Controllers\Admin\AdminProductController::class, 'lowStock'])->name('admin.products.low-stock');
    Route::patch('/products/{product}/adjust-stock', [\App\Http\Controllers\Admin\AdminProductController::class, 'adjustStock'])->name('admin.products.adjust-stock');
    Route::patch('/products/bulk-update-stock', [\App\Http\Controllers\Admin\AdminProductController::class, 'bulkUpdateStock'])->name('admin.products.bulk-update-stock');
    
    // Category Management
    Route::resource('categories', \App\Http\Controllers\Admin\AdminCategoryController::class);
    Route::patch('/categories/{category}/toggle-active', [\App\Http\Controllers\Admin\AdminCategoryController::class, 'toggleActive'])
        ->name('categories.toggle-active');
    
    // Payment Settings Management
    Route::get('/payment-settings', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'index'])
        ->name('payment-settings.index');
    Route::post('/payment-settings', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'store'])
        ->name('payment-settings.store');
    Route::put('/payment-settings/{paymentSetting}', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'update'])
        ->name('payment-settings.update');
    Route::delete('/payment-settings/{paymentSetting}', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'destroy'])
        ->name('payment-settings.destroy');
    Route::patch('/payment-settings/{paymentSetting}/toggle-active', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'toggleActive'])
        ->name('payment-settings.toggle-active');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// BYPASS VALIDATION TEST - REMOVE AFTER FIXING  
Route::post('/bypass-order-validation', function(Request $request) {
    \Log::info('=== BYPASS VALIDATION TEST ===', [
        'request_data' => $request->all()
    ]);
    
    try {
        // Simulate real order data from your form submission
        $order = \App\Models\Order::create([
            'customer_name' => $request->input('customer_name', 'Test Customer'),
            'customer_phone' => $request->input('customer_phone', '09123456789'),  
            'customer_email' => $request->input('customer_email'),
            'status' => 'pending',
            'total_amount' => 999.99, // Use fixed amount for now
            'pickup_or_delivery' => $request->input('pickup_or_delivery', 'pickup'),
            'payment_method' => $request->input('payment_method', 'cash'),
            'payment_status' => 'pending'
        ]);
        
        \Log::info('✅ Bypass order created', ['order_id' => $order->id]);
        return redirect()->route('order.confirmation', ['order' => $order->id])->with('success', 'Bypass order created!');
        
    } catch (\Exception $e) {
        \Log::error('❌ Bypass order failed', ['error' => $e->getMessage()]);
        return back()->withErrors(['error' => $e->getMessage()]);
    }
});

// EMERGENCY MINIMAL ORDER TEST - REMOVE AFTER FIXING
Route::post('/test-simple-order', function(Request $request) {
    \Log::info('=== MINIMAL ORDER TEST ===');
    try {
        $order = \App\Models\Order::create([
            'customer_name' => 'Test Customer',
            'customer_phone' => '09123456789',
            'status' => 'pending',
            'total_amount' => 999.99,
            'pickup_or_delivery' => 'pickup',
            'payment_method' => 'cash',
            'payment_status' => 'pending'
        ]);
        
        \Log::info('✅ Minimal order created', ['order_id' => $order->id]);
        return redirect()->route('order.confirmation', ['order' => $order->id])->with('success', 'Test order created!');
        
    } catch (\Exception $e) {
        \Log::error('❌ Minimal order failed', ['error' => $e->getMessage()]);
        return back()->withErrors(['error' => $e->getMessage()]);
    }
});

// EMERGENCY DEBUG ROUTES - REMOVE AFTER FIXING
Route::get('/debug-db', function() {
    try {
        // Test database connection
        $result = DB::select('SELECT 1 as test');
        
        // Test orders table structure
        $columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        
        // Try to create a minimal order
        $order = \App\Models\Order::create([
            'customer_name' => 'Debug Test',
            'customer_phone' => '1234567890',
            'status' => 'pending',
            'total_amount' => 99.99,
            'pickup_or_delivery' => 'pickup',
            'payment_method' => 'cash',
            'payment_status' => 'pending'
        ]);
        
        return response()->json([
            'status' => 'SUCCESS',
            'db_test' => $result,
            'columns' => $columns,
            'order_created' => $order->id
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'ERROR',
            'message' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => basename($e->getFile())
        ]);
    }
});

// Social Authentication Routes
Route::prefix('auth')->group(function () {
    Route::get('/{provider}', [\App\Http\Controllers\Auth\SocialAuthController::class, 'redirect'])
        ->where('provider', 'facebook|google')
        ->name('social.redirect');
    
    Route::get('/{provider}/callback', [\App\Http\Controllers\Auth\SocialAuthController::class, 'callback'])
        ->where('provider', 'facebook|google')
        ->name('social.callback');
});
