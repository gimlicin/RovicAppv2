<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Cloudinary\Cloudinary as CloudinaryAPI;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $stockFilter = $request->input('stock_filter', 'all');

        $query = Product::with('category')
            ->latest();

        if ($stockFilter === 'in_stock') {
            // Products that are available (tracked stock with quantity > 0, or not tracking stock)
            $query->where(function ($q) {
                $q->where(function ($q2) {
                    $q2->where('track_stock', true)
                       ->where('stock_quantity', '>', 0);
                })
                ->orWhere('track_stock', false);
            });
        } elseif ($stockFilter === 'low_stock') {
            // Use the dedicated lowStock scope from the Product model
            $query->lowStock();
        }

        $products = $query->paginate(10);

        $stats = [
            'total_products' => Product::count(),
            'active_products' => Product::active()->count(),
            'best_selling_products' => Product::bestSelling()->count(),
            'total_inventory_value' => Product::sum(\DB::raw('price * stock_quantity')),
        ];

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'stats' => $stats,
            'filters' => [
                'stock_filter' => $stockFilter,
            ],
        ]);
    }

    public function create()
    {
        $categories = Category::active()->get();

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
            'image_url' => 'nullable|string', // For backward compatibility
            'is_active' => 'boolean',
            'is_best_selling' => 'boolean',
            'is_promo' => 'boolean',
            // Stock management fields
            'max_order_quantity' => 'nullable|integer|min:1',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string|in:kg,g,lbs,oz,pieces,packs',
        ]);

        // Handle image upload
        $uploadDebug = [];
        
        // Debug: Check if file was even sent
        if (!$request->hasFile('image')) {
            file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - NO FILE: hasFile(image) returned false' . "\n", FILE_APPEND);
        }
        
        if ($request->hasFile('image')) {
            $uploadDebug['file_uploaded'] = true;
            $uploadDebug['file_name'] = $request->file('image')->getClientOriginalName();
            $uploadDebug['file_size'] = $request->file('image')->getSize();
            $uploadDebug['cloud_name'] = config('cloudinary.cloud_name');
            $uploadDebug['api_key_set'] = !empty(config('cloudinary.api_key'));
            $uploadDebug['api_secret_set'] = !empty(config('cloudinary.api_secret'));
            
            try {
                $uploadDebug['attempt'] = 'cloudinary_upload_starting';
                
                // Debug: Check config BEFORE upload
                $cloudName = config('cloudinary.cloud_name');
                $apiKey = config('cloudinary.api_key');
                $apiSecret = config('cloudinary.api_secret');
                
                if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
                    throw new \Exception('Cloudinary config incomplete: cloud_name=' . ($cloudName ?: 'NULL') . ', api_key=' . ($apiKey ? 'SET' : 'NULL') . ', api_secret=' . ($apiSecret ? 'SET' : 'NULL'));
                }
                
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - BEFORE UPLOAD: Config OK, attempting upload...' . "\n", FILE_APPEND);
                
                // Create Cloudinary instance with config
                $cloudinary = new CloudinaryAPI([
                    'cloud' => [
                        'cloud_name' => $cloudName,
                        'api_key' => $apiKey,
                        'api_secret' => $apiSecret,
                    ],
                    'url' => [
                        'secure' => true
                    ]
                ]);
                
                // Upload using the Cloudinary SDK directly
                $uploadResult = $cloudinary->uploadApi()->upload(
                    $request->file('image')->getRealPath(),
                    [
                        'folder' => 'rovic-products',
                        'resource_type' => 'image',
                    ]
                );
                
                // Convert ApiResponse object to array
                $resultArray = $uploadResult->getArrayCopy();
                
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - AFTER UPLOAD: Got response, keys: ' . implode(', ', array_keys($resultArray)) . "\n", FILE_APPEND);
                
                // Get the secure URL from the result array
                if (isset($resultArray['secure_url'])) {
                    $validated['image_url'] = $resultArray['secure_url'];
                } else {
                    throw new \Exception('No secure_url in response: ' . json_encode($resultArray));
                }
                $uploadDebug['result'] = 'cloudinary_success';
                $uploadDebug['url'] = $validated['image_url'];
                
                // Store success message in debug file AND session
                $debugMsg = 'Cloudinary upload SUCCESS! URL: ' . $validated['image_url'];
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - ' . $debugMsg . "\n", FILE_APPEND);
                session()->flash('cloudinary_debug', $debugMsg);
            } catch (\Exception $e) {
                $uploadDebug['result'] = 'cloudinary_failed';
                $uploadDebug['error_message'] = $e->getMessage();
                $uploadDebug['error_class'] = get_class($e);
                $uploadDebug['error_code'] = $e->getCode();
                $uploadDebug['error_file'] = $e->getFile();
                $uploadDebug['error_line'] = $e->getLine();
                
                // Fallback to local storage
                $image = $request->file('image');
                $filename = time() . '_' . $image->getClientOriginalName();
                $path = $image->storeAs('products', $filename, 'public');
                $validated['image_url'] = '/storage/' . $path;
                $uploadDebug['fallback_path'] = $validated['image_url'];
                
                // Store DETAILED error in debug file
                $debugMsg = 'Cloudinary FAILED: ' . $e->getMessage() 
                    . ' | Class: ' . get_class($e) 
                    . ' | File: ' . basename($e->getFile()) . ':' . $e->getLine()
                    . ' | Fallback: ' . $validated['image_url'];
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - ' . $debugMsg . "\n", FILE_APPEND);
                
                // Also log the stack trace for deeper debugging
                file_put_contents(storage_path('cloudinary_debug.txt'), '  Stack trace: ' . $e->getTraceAsString() . "\n\n", FILE_APPEND);
                
                session()->flash('cloudinary_debug', $debugMsg);
            }
        } elseif ($request->filled('image_url')) {
            // Keep existing image_url if provided (backward compatibility)
            $validated['image_url'] = $request->image_url;
        } else {
            $validated['image_url'] = null;
        }

        // Remove 'image' from validated data as it's not a database column
        unset($validated['image']);

        // Set default values for boolean fields (checkboxes don't send data when unchecked)
        $validated['is_active'] = $request->has('is_active') ? (bool)$request->is_active : false;
        $validated['is_best_selling'] = $request->has('is_best_selling') ? (bool)$request->is_best_selling : false;
        $validated['is_promo'] = $request->has('is_promo') ? (bool)$request->is_promo : false;
        
        // Set default values for stock management
        $validated['max_order_quantity'] = $validated['max_order_quantity'] ?? 100;
        $validated['low_stock_threshold'] = $validated['low_stock_threshold'] ?? 10;
        $validated['track_stock'] = $request->has('track_stock') ? (bool)$request->track_stock : true;
        $validated['reserved_stock'] = 0;

        $product = Product::create($validated);

        ActivityLogger::log(
            'product_created',
            "Created product: {$product->name}",
            $product
        );

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function show(Product $product)
    {
        $product->load('category');

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product)
    {
        $categories = Category::active()->get();
        $product->load('category');

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
            'image_url' => 'nullable|string', // For backward compatibility
            'is_active' => 'boolean',
            'is_best_selling' => 'boolean',
            'is_promo' => 'boolean',
            // Stock management fields
            'max_order_quantity' => 'nullable|integer|min:1',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string|in:kg,g,lbs,oz,pieces,packs',
        ]);

        // Handle image upload
        if (!$request->hasFile('image')) {
            file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - UPDATE: NO FILE sent' . "\n", FILE_APPEND);
        }
        
        if ($request->hasFile('image')) {
            try {
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - UPDATE: Starting Cloudinary upload for product #' . $product->id . "\n", FILE_APPEND);
                
                // Create Cloudinary instance
                $cloudinary = new CloudinaryAPI([
                    'cloud' => [
                        'cloud_name' => config('cloudinary.cloud_name'),
                        'api_key' => config('cloudinary.api_key'),
                        'api_secret' => config('cloudinary.api_secret'),
                    ],
                    'url' => [
                        'secure' => true
                    ]
                ]);
                
                // Upload using the Cloudinary SDK
                $uploadResult = $cloudinary->uploadApi()->upload(
                    $request->file('image')->getRealPath(),
                    [
                        'folder' => 'rovic-products',
                        'resource_type' => 'image',
                    ]
                );
                
                // Convert ApiResponse object to array
                $resultArray = $uploadResult->getArrayCopy();
                $validated['image_url'] = $resultArray['secure_url'];
                
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - UPDATE SUCCESS! URL: ' . $validated['image_url'] . "\n", FILE_APPEND);
                
                // Delete old local image if exists
                if ($product->image_url && str_starts_with($product->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $product->image_url);
                    \Storage::disk('public')->delete($oldPath);
                }
            } catch (\Exception $e) {
                $debugMsg = 'UPDATE FAILED: ' . $e->getMessage() . ' | Error Class: ' . get_class($e);
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - ' . $debugMsg . "\n", FILE_APPEND);
                
                // Fallback to local storage
                if ($product->image_url && str_starts_with($product->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $product->image_url);
                    \Storage::disk('public')->delete($oldPath);
                }
                $image = $request->file('image');
                $filename = time() . '_' . $image->getClientOriginalName();
                $path = $image->storeAs('products', $filename, 'public');
                $validated['image_url'] = '/storage/' . $path;
                
                file_put_contents(storage_path('cloudinary_debug.txt'), date('Y-m-d H:i:s') . ' - UPDATE FALLBACK: ' . $validated['image_url'] . "\n", FILE_APPEND);
            }
        } elseif ($request->filled('image_url')) {
            // Keep existing image_url if provided
            $validated['image_url'] = $request->image_url;
            error_log('ℹ️ KEEPING EXISTING IMAGE URL (UPDATE): ' . $validated['image_url']);
        } else {
            error_log('ℹ️ NO IMAGE CHANGE (UPDATE) - Keeping product image');
        }

        // Remove 'image' from validated data
        unset($validated['image']);

        // Set default values for boolean fields (checkboxes don't send data when unchecked)
        $validated['is_active'] = $request->has('is_active') ? (bool)$request->is_active : false;
        $validated['is_best_selling'] = $request->has('is_best_selling') ? (bool)$request->is_best_selling : false;
        $validated['is_promo'] = $request->has('is_promo') ? (bool)$request->is_promo : false;
        $validated['track_stock'] = $request->has('track_stock') ? (bool)$request->track_stock : false;

        // Don't allow updating reserved_stock directly - it's managed by the system
        unset($validated['reserved_stock']);

        $product->update($validated);

        ActivityLogger::log(
            'product_updated',
            "Updated product: {$product->name}",
            $product
        );

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        ActivityLogger::log(
            'product_deleted',
            "Deleted product: {$product->name}",
            $product
        );

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function toggleBestSelling(Product $product)
    {
        $product->update([
            'is_best_selling' => !$product->is_best_selling
        ]);

        ActivityLogger::log(
            'product_toggle_best_selling',
            ($product->is_best_selling ? 'Marked as best selling: ' : 'Removed best selling flag from: ') . $product->name,
            $product
        );

        return back()->with('success', 'Best selling status updated.');
    }

    public function toggleActive(Product $product)
    {
        $product->update([
            'is_active' => !$product->is_active
        ]);

        ActivityLogger::log(
            'product_toggle_active',
            ($product->is_active ? 'Activated product: ' : 'Deactivated product: ') . $product->name,
            $product
        );

        return back()->with('success', 'Product status updated.');
    }

    /**
     * Adjust stock quantity for a product
     */
    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'adjustment_type' => 'required|in:add,subtract,set',
            'quantity' => 'required|integer|min:0',
            'reason' => 'nullable|string|max:255',
        ]);

        $oldQuantity = $product->stock_quantity;

        switch ($validated['adjustment_type']) {
            case 'add':
                $newQuantity = $oldQuantity + $validated['quantity'];
                break;
            case 'subtract':
                $newQuantity = max(0, $oldQuantity - $validated['quantity']);
                break;
            case 'set':
                $newQuantity = $validated['quantity'];
                break;
        }

        $product->update(['stock_quantity' => $newQuantity]);

        \Log::info('Stock adjustment', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'old_quantity' => $oldQuantity,
            'new_quantity' => $newQuantity,
            'adjustment_type' => $validated['adjustment_type'],
            'quantity' => $validated['quantity'],
            'reason' => $validated['reason'],
            'admin_id' => auth()->id(),
        ]);

        ActivityLogger::log(
            'product_stock_adjusted',
            "Adjusted stock for {$product->name} from {$oldQuantity} to {$newQuantity}" . ($validated['reason'] ? " (Reason: {$validated['reason']})" : ''),
            $product
        );

        return back()->with('success', "Stock updated from {$oldQuantity} to {$newQuantity}.");
    }

    /**
     * Get low stock products
     */
    public function lowStock()
    {
        $products = Product::with('category')
            ->where('is_active', true)
            ->whereRaw('stock_quantity <= COALESCE(low_stock_threshold, 5)')
            ->orderByRaw('stock_quantity ASC, (stock_quantity / COALESCE(low_stock_threshold, 5)) ASC')
            ->paginate(20);

        return Inertia::render('Admin/Products/LowStock', [
            'products' => $products
        ]);
    }

    /**
     * Bulk update stock quantities
     */
    public function bulkUpdateStock(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.product_id' => 'required|exists:products,id',
            'updates.*.stock_quantity' => 'required|integer|min:0',
        ]);

        $updatedCount = 0;
        foreach ($validated['updates'] as $update) {
            $product = Product::find($update['product_id']);
            if ($product) {
                $oldQuantity = $product->stock_quantity;
                $product->update(['stock_quantity' => $update['stock_quantity']]);

                \Log::info('Bulk stock update', [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $update['stock_quantity'],
                    'admin_id' => auth()->id(),
                ]);

                ActivityLogger::log(
                    'product_bulk_stock_updated',
                    "Bulk stock update for {$product->name}: {$oldQuantity} → {$update['stock_quantity']}",
                    $product
                );

                $updatedCount++;
            }
        }

        return back()->with('success', "Updated stock for {$updatedCount} products.");
    }
}
