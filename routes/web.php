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

// Public QR code access for checkout (customers need this)
Route::get('/admin/payment-settings/{paymentSetting}/qr-code', [\App\Http\Controllers\Admin\PaymentSettingController::class, 'viewQrCode'])
    ->name('admin.payment-settings.qr-code');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// ULTRA SIMPLE ORDER TEST - REMOVE AFTER FIXING  
Route::post('/ultra-simple-order', function(Request $request) {
    \Log::info('=== ULTRA SIMPLE ORDER TEST ===');
    
    try {
        // Create the most basic order possible
        $order = \App\Models\Order::create([
            'customer_name' => 'Ultra Test Customer',
            'customer_phone' => '09123456789',
            'status' => \App\Models\Order::STATUS_PENDING,
            'total_amount' => 100.00,
            'pickup_or_delivery' => \App\Models\Order::PICKUP,
            'payment_method' => \App\Models\Order::PAYMENT_CASH,
            'payment_status' => \App\Models\Order::PAYMENT_STATUS_PENDING
        ]);
        
        \Log::info('✅ Ultra simple order created', ['order_id' => $order->id]);
        
        // Direct URL redirect instead of route
        return redirect('/order-confirmation/' . $order->id)->with('success', 'Ultra simple order created!');
        
    } catch (\Exception $e) {
        \Log::error('❌ Ultra simple order failed', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
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

// Temporary debug route - remove after fixing Cloudinary
Route::get('/test-throttle', function () {
    $throttle = app(\App\Services\LoginThrottleService::class);
    $testKey = 'test_user';
    
    // Test basic operations
    $throttle->hit($testKey);
    $attempts = $throttle->attempts($testKey);
    
    return response()->json([
        'cache_working' => true,
        'attempts' => $attempts,
        'cache_driver' => config('cache.default'),
        'cache_store' => env('CACHE_STORE'),
    ]);
});

// Test Cloudinary configuration
Route::get('/debug-cloudinary', function() {
    error_log('🧪 DEBUG ENDPOINT HIT - Testing if error_log() works!');
    
    return response()->json([
        'cloudinary_config' => [
            'cloud_name' => config('cloudinary.cloud_name'),
            'api_key' => config('cloudinary.api_key'),
            'has_secret' => !empty(config('cloudinary.api_secret')),
        ],
        'env_direct' => [
            'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
            'api_key' => env('CLOUDINARY_API_KEY'),
            'has_secret' => !empty(env('CLOUDINARY_API_SECRET')),
        ],
        'package_exists' => class_exists('CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary'),
        'message' => 'Check Render logs for: 🧪 DEBUG ENDPOINT HIT',
    ]);
})->name('debug.cloudinary');

// Test Cloudinary upload with a sample image
Route::get('/test-cloudinary-upload', function() {
    error_log('🧪 TEST UPLOAD ENDPOINT HIT!');
    error_log('☁️ Cloud Name: ' . config('cloudinary.cloud_name'));
    error_log('🔑 API Key: ' . config('cloudinary.api_key'));
    error_log('🔐 Has Secret: ' . (!empty(config('cloudinary.api_secret')) ? 'YES' : 'NO'));
    
    try {
        // Create a test image in memory
        $testImage = imagecreate(100, 100);
        $bgColor = imagecolorallocate($testImage, 255, 0, 0);
        $tmpFile = sys_get_temp_dir() . '/test-' . time() . '.png';
        imagepng($testImage, $tmpFile);
        imagedestroy($testImage);
        
        error_log('📸 Test image created: ' . $tmpFile);
        error_log('🚀 Attempting Cloudinary upload...');
        
        // Upload to Cloudinary
        $result = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload($tmpFile, [
            'folder' => 'rovic-products',
            'resource_type' => 'image'
        ]);
        
        $url = $result->getSecurePath();
        error_log('✅ CLOUDINARY UPLOAD SUCCESS! URL: ' . $url);
        
        // Clean up
        @unlink($tmpFile);
        
        return response()->json([
            'success' => true,
            'message' => 'Cloudinary upload works!',
            'url' => $url,
            'check_logs' => 'Look for ✅ CLOUDINARY UPLOAD SUCCESS in Render logs',
        ]);
        
    } catch (\Exception $e) {
        error_log('❌ CLOUDINARY TEST FAILED: ' . $e->getMessage());
        error_log('❌ Exception class: ' . get_class($e));
        error_log('❌ Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'class' => get_class($e),
            'check_logs' => 'Look for ❌ CLOUDINARY TEST FAILED in Render logs',
        ], 500);
    }
})->name('test.cloudinary.upload');

// Clear config cache
Route::get('/clear-config', function() {
    \Artisan::call('config:clear');
    \Artisan::call('cache:clear');
    
    return response()->json([
        'message' => 'Config and cache cleared successfully!',
        'config_clear_output' => \Artisan::output(),
    ]);
})->name('clear.config');

// Test Cloudinary configuration
Route::get('/test-cloudinary-config', function() {
    $results = [];
    
    // Test 1: Check env vars
    $results['env_vars'] = [
        'CLOUDINARY_URL' => env('CLOUDINARY_URL') ? 'SET (length: ' . strlen(env('CLOUDINARY_URL')) . ')' : 'NULL',
        'CLOUDINARY_CLOUD_NAME' => env('CLOUDINARY_CLOUD_NAME') ?: 'NULL',
        'CLOUDINARY_API_KEY' => env('CLOUDINARY_API_KEY') ?: 'NULL',
        'CLOUDINARY_API_SECRET' => env('CLOUDINARY_API_SECRET') ? 'SET' : 'NULL',
    ];
    
    // Test 2: Check config values
    $results['config_values'] = [
        'cloud_url' => config('cloudinary.cloud_url') ? 'SET' : 'NULL',
        'cloud_name' => config('cloudinary.cloud_name') ?: 'NULL',
        'api_key' => config('cloudinary.api_key') ?: 'NULL',
        'api_secret' => config('cloudinary.api_secret') ? 'SET' : 'NULL',
    ];
    
    // Test 3: Try to get Cloudinary instance
    try {
        $cloudinary = new \Cloudinary\Cloudinary();
        $results['cloudinary_instance'] = 'SUCCESS - Instance created';
        
        // Try to get config from instance
        try {
            $config = $cloudinary->configuration;
            $results['cloudinary_config'] = [
                'cloud_name' => $config->cloud->cloudName ?? 'NULL',
                'api_key' => $config->cloud->apiKey ?? 'NULL',
                'api_secret' => $config->cloud->apiSecret ? 'SET' : 'NULL',
            ];
        } catch (\Exception $e) {
            $results['cloudinary_config'] = 'ERROR: ' . $e->getMessage();
        }
    } catch (\Exception $e) {
        $results['cloudinary_instance'] = 'FAILED: ' . $e->getMessage();
        $results['error_class'] = get_class($e);
        $results['error_trace'] = explode("\n", $e->getTraceAsString());
    }
    
    return response()->json($results, 200, [], JSON_PRETTY_PRINT);
})->name('test.cloudinary.config');

// View Cloudinary upload debug info (HTML version for better readability)
Route::get('/cloudinary-last-upload', function() {
    $debugFile = storage_path('cloudinary_debug.txt');
    
    if (!file_exists($debugFile)) {
        return response('<h2>No debug file yet</h2><p>Upload an image first.</p>');
    }
    
    // Read last 100 lines
    $content = file_get_contents($debugFile);
    $lines = explode("\n", $content);
    $lastLines = array_slice($lines, -100);
    
    // Format as HTML for better readability
    $html = '<html><head><style>
        body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        h2 { color: #4ec9b0; }
        .error { color: #f48771; background: #2d1515; padding: 10px; margin: 5px 0; border-left: 4px solid #f48771; }
        .success { color: #4ade80; background: #1a2e1a; padding: 10px; margin: 5px 0; border-left: 4px solid #4ade80; }
        .info { color: #60a5fa; padding: 5px; }
        .trace { color: #888; font-size: 11px; margin-left: 20px; }
        pre { background: #252526; padding: 10px; overflow-x: auto; }
    </style></head><body>';
    
    $html .= '<h2>🔍 Cloudinary Debug Log (Last 100 Lines)</h2>';
    
    foreach ($lastLines as $line) {
        if (empty(trim($line))) continue;
        
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $line)) {
            // Timestamp line - this is a new log entry
            if (stripos($line, 'FAILED') !== false || stripos($line, 'ERROR') !== false) {
                $html .= '<div class="error">' . htmlspecialchars($line) . '</div>';
            } elseif (stripos($line, 'SUCCESS') !== false) {
                $html .= '<div class="success">' . htmlspecialchars($line) . '</div>';
            } else {
                $html .= '<div class="info">' . htmlspecialchars($line) . '</div>';
            }
        } elseif (preg_match('/^\s+(Stack trace:|#\d+)/', $line)) {
            // Stack trace line
            $html .= '<div class="trace">' . htmlspecialchars($line) . '</div>';
        } else {
            $html .= '<div class="info">' . htmlspecialchars($line) . '</div>';
        }
    }
    
    $html .= '</body></html>';
    
    return response($html);
})->name('cloudinary.last.upload');

// View Laravel logs
Route::get('/debug-logs', function() {
    $logPath = storage_path('logs/laravel.log');
    $storagePath = storage_path();
    $logsDir = storage_path('logs');
    
    $info = [
        'storage_path' => $storagePath,
        'logs_dir' => $logsDir,
        'logs_dir_exists' => is_dir($logsDir),
        'logs_dir_writable' => is_writable($logsDir),
        'log_file_path' => $logPath,
        'log_file_exists' => file_exists($logPath),
    ];
    
    if (!file_exists($logPath)) {
        // Try to create it
        @touch($logPath);
        @chmod($logPath, 0664);
        
        return response()->json([
            'error' => 'Log file does not exist (tried to create it)',
            'info' => $info,
            'all_logs' => is_dir($logsDir) ? scandir($logsDir) : 'logs dir does not exist',
        ]);
    }
    
    // Get last 200 lines
    $content = file_get_contents($logPath);
    $lines = explode("\n", $content);
    $lines = array_slice($lines, -200);
    
    return response('<pre style="background:#1e1e1e;color:#dcdcdc;padding:20px;font-size:12px;line-height:1.5;">' 
        . htmlspecialchars(implode("\n", $lines)) 
        . '</pre>');
})->name('debug.logs');
