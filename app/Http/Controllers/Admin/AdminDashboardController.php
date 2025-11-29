<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\Category;
use App\Models\User;
use App\Models\Order;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        $stats = [
            'total_products' => Product::count(),
            'total_users' => User::where('role', '!=', 'admin')->count(),
            'total_categories' => Category::count(),
            'total_inventory_value' => Product::sum(\DB::raw('price * stock_quantity')),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'pending_payments' => Order::where('payment_status', 'submitted')->count(),
            'total_revenue' => Order::where('payment_status', 'approved')->sum('total_amount'),
        ];

        $recentProducts = Product::with('category')
            ->latest()
            ->take(5)
            ->get();

        $recentOrders = Order::with(['user', 'orderItems.product'])
            ->latest()
            ->take(5)
            ->get();

        // Super Admin gets the full analytics dashboard
        if ($user->isSuperAdmin()) {
            $activityLogActions = ActivityLog::select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action');

            $activityLogUsers = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role']);

            return Inertia::render('SuperAdmin/Dashboard', [
                'stats' => $stats,
                'recentProducts' => $recentProducts,
                'recentOrders' => $recentOrders,
                'activityLogActions' => $activityLogActions,
                'activityLogUsers' => $activityLogUsers,
            ]);
        }

        // Regular Admin gets redirected to orders (handled by route, but kept for clarity)
        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentProducts' => $recentProducts,
            'recentOrders' => $recentOrders,
        ]);
    }
}
