<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class AdminProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')
            ->latest()
            ->paginate(10);

        $stats = [
            'total_products' => Product::count(),
            'active_products' => Product::active()->count(),
            'best_selling_products' => Product::bestSelling()->count(),
            'total_inventory_value' => Product::sum(\DB::raw('price * stock_quantity')),
        ];

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'stats' => $stats,
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
            // Stock management fields
            'max_order_quantity' => 'nullable|integer|min:1',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string|in:kg,g,lbs,oz,pieces,packs',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            try {
                \Log::info('🔄 Attempting Cloudinary upload...', [
                    'file_name' => $request->file('image')->getClientOriginalName(),
                    'cloud_name' => config('cloudinary.cloud_name'),
                    'has_api_key' => !empty(config('cloudinary.api_key')),
                ]);
                
                // Upload to Cloudinary
                $uploadedFile = Cloudinary::upload($request->file('image')->getRealPath(), [
                    'folder' => 'rovic-products',
                    'resource_type' => 'image'
                ]);
                
                $validated['image_url'] = $uploadedFile->getSecurePath();
                \Log::info('✅ Cloudinary upload SUCCESS!', ['url' => $validated['image_url']]);
            } catch (\Exception $e) {
                \Log::error('❌ Cloudinary upload FAILED', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'cloud_name' => config('cloudinary.cloud_name'),
                ]);
                // Fallback to local storage
                $image = $request->file('image');
                $filename = time() . '_' . $image->getClientOriginalName();
                $path = $image->storeAs('products', $filename, 'public');
                $validated['image_url'] = '/storage/' . $path;
                \Log::info('⚠️ Using local storage fallback', ['path' => $validated['image_url']]);
            }
        } elseif ($request->filled('image_url')) {
            // Keep existing image_url if provided (backward compatibility)
            $validated['image_url'] = $request->image_url;
        } else {
            $validated['image_url'] = null;
        }

        // Remove 'image' from validated data as it's not a database column
        unset($validated['image']);

        // Set default values for stock management
        $validated['max_order_quantity'] = $validated['max_order_quantity'] ?? 100;
        $validated['low_stock_threshold'] = $validated['low_stock_threshold'] ?? 10;
        $validated['track_stock'] = $validated['track_stock'] ?? true;
        $validated['reserved_stock'] = 0;

        $product = Product::create($validated);

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
            // Stock management fields
            'max_order_quantity' => 'nullable|integer|min:1',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'track_stock' => 'boolean',
            'weight' => 'required|numeric|min:0',
            'unit' => 'required|string|in:kg,g,lbs,oz,pieces,packs',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            try {
                \Log::info('🔄 Attempting Cloudinary upload (update)...', [
                    'file_name' => $request->file('image')->getClientOriginalName(),
                    'product_id' => $product->id,
                    'cloud_name' => config('cloudinary.cloud_name'),
                ]);
                
                // Upload to Cloudinary
                $uploadedFile = Cloudinary::upload($request->file('image')->getRealPath(), [
                    'folder' => 'rovic-products',
                    'resource_type' => 'image'
                ]);
                $validated['image_url'] = $uploadedFile->getSecurePath();
                \Log::info('✅ Cloudinary upload SUCCESS (update)!', ['url' => $validated['image_url']]);
                
                // Delete old local image if exists
                if ($product->image_url && str_starts_with($product->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $product->image_url);
                    \Storage::disk('public')->delete($oldPath);
                }
            } catch (\Exception $e) {
                \Log::error('❌ Cloudinary upload FAILED (update)', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                // Fallback to local storage
                if ($product->image_url && str_starts_with($product->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $product->image_url);
                    \Storage::disk('public')->delete($oldPath);
                }
                $image = $request->file('image');
                $filename = time() . '_' . $image->getClientOriginalName();
                $path = $image->storeAs('products', $filename, 'public');
                $validated['image_url'] = '/storage/' . $path;
                \Log::info('⚠️ Using local storage fallback (update)', ['path' => $validated['image_url']]);
            }
        } elseif ($request->filled('image_url')) {
            // Keep existing image_url if provided
            $validated['image_url'] = $request->image_url;
        }
        // If neither, keep existing product image

        // Remove 'image' from validated data
        unset($validated['image']);

        // Don't allow updating reserved_stock directly - it's managed by the system
        unset($validated['reserved_stock']);

        $product->update($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function toggleBestSelling(Product $product)
    {
        $product->update([
            'is_best_selling' => !$product->is_best_selling
        ]);

        return back()->with('success', 'Best selling status updated.');
    }

    public function toggleActive(Product $product)
    {
        $product->update([
            'is_active' => !$product->is_active
        ]);

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

        // Log the stock adjustment (you can implement a stock_adjustments table later)
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
                
                $updatedCount++;
            }
        }

        return back()->with('success', "Updated stock for {$updatedCount} products.");
    }
}
