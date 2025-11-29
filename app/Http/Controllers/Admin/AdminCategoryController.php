<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminCategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')
            ->latest()
            ->paginate(10);

        $stats = [
            'total_categories' => Category::count(),
            'active_categories' => Category::active()->count(),
            'total_products' => Category::withCount('products')->get()->sum('products_count'),
        ];

        return Inertia::render('SuperAdmin/Categories/Index', [
            'categories' => $categories,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/Categories/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Generate a unique slug based on the category name
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $validated['slug'] = $slug;

        $category = Category::create($validated);

        ActivityLogger::log(
            'category_created',
            "Created category: {$category->name}",
            $category
        );

        return redirect()->route('super-admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(Category $category)
    {
        $category->load('products');

        return Inertia::render('Admin/Categories/Show', [
            'category' => $category,
        ]);
    }

    public function edit(Category $category)
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Regenerate slug when the name changes, ensuring uniqueness
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;

        while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $validated['slug'] = $slug;

        $category->update($validated);

        ActivityLogger::log(
            'category_updated',
            "Updated category: {$category->name}",
            $category
        );

        return redirect()->route('super-admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        // Check if category has products
        if ($category->products()->count() > 0) {
            return back()->with('error', 'Cannot delete category with existing products.');
        }

        $name = $category->name;
        $category->delete();

        ActivityLogger::log(
            'category_deleted',
            "Deleted category: {$name}",
            $category
        );

        return redirect()->route('super-admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }

    public function toggleActive(Category $category)
    {
        $category->update([
            'is_active' => !$category->is_active
        ]);

        ActivityLogger::log(
            'category_toggle_active',
            ($category->is_active ? 'Activated category: ' : 'Deactivated category: ') . $category->name,
            $category
        );

        return back()->with('success', 'Category status updated.');
    }
}
