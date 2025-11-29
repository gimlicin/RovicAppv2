<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Show the Super Admin Orders Report page.
     */
    public function ordersIndex(Request $request)
    {
        $period = $request->input('period', 'daily');

        return Inertia::render('SuperAdmin/Reports/Orders', [
            'filters' => [
                'period' => $period,
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
            ],
        ]);
    }

    /**
     * Generate Order List PDF report for Super Admin.
     */
    public function ordersPdf(Request $request)
    {
        $user = $request->user();

        $period = $request->input('period', 'daily'); // daily | weekly | monthly | yearly | custom
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');

        $now = Carbon::now();
        $startDate = null;
        $endDate = null;
        $periodLabel = '';

        switch ($period) {
            case 'weekly':
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                $periodLabel = 'This Week';
                break;
            case 'monthly':
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                $periodLabel = 'This Month';
                break;
            case 'yearly':
                $startDate = $now->copy()->startOfYear();
                $endDate = $now->copy()->endOfYear();
                $periodLabel = 'This Year';
                break;
            case 'custom':
                $startDate = $startDateInput ? Carbon::parse($startDateInput)->startOfDay() : $now->copy()->startOfDay();
                $endDate = $endDateInput ? Carbon::parse($endDateInput)->endOfDay() : $now->copy()->endOfDay();
                $periodLabel = 'Custom Range';
                break;
            case 'daily':
            default:
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                $periodLabel = 'Today';
                break;
        }

        $ordersQuery = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc');

        $orders = $ordersQuery->get();

        // Basic aggregates for summary
        $totalOrders = $orders->count();
        $totalRevenue = $orders->sum('total_amount');

        // Daily statistics for simple charts (orders & revenue per day)
        $dailyStats = [];

        foreach ($orders as $order) {
            if (!$order->created_at) {
                continue;
            }

            $dateKey = $order->created_at->format('Y-m-d');

            if (!isset($dailyStats[$dateKey])) {
                $dailyStats[$dateKey] = [
                    'orders' => 0,
                    'revenue' => 0.0,
                ];
            }

            $dailyStats[$dateKey]['orders']++;
            $dailyStats[$dateKey]['revenue'] += (float) $order->total_amount;
        }

        ksort($dailyStats);

        $maxOrders = 0;
        $maxRevenue = 0.0;

        foreach ($dailyStats as $stats) {
            if ($stats['orders'] > $maxOrders) {
                $maxOrders = $stats['orders'];
            }
            if ($stats['revenue'] > $maxRevenue) {
                $maxRevenue = $stats['revenue'];
            }
        }

        $generatedAt = Carbon::now();

        $pdf = Pdf::loadView('reports.orders-pdf', [
            'orders' => $orders,
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenue,
            'dailyStats' => $dailyStats,
            'maxOrders' => $maxOrders,
            'maxRevenue' => $maxRevenue,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'period' => $period,
            'periodLabel' => $periodLabel,
            'generatedAt' => $generatedAt,
            'printedBy' => $user ? $user->name : 'System',
        ])->setPaper('a4', 'portrait');

        $filename = 'order-report-' . $generatedAt->format('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Generate Activity Logs PDF report for Super Admin.
     */
    public function activityLogsPdf(Request $request)
    {
        $user = $request->user();

        $period = $request->input('period', 'daily'); // daily | weekly | monthly | yearly | custom
        $startDateInput = $request->input('start_date');
        $endDateInput = $request->input('end_date');

        $now = Carbon::now();
        $startDate = null;
        $endDate = null;
        $periodLabel = '';

        switch ($period) {
            case 'weekly':
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                $periodLabel = 'This Week';
                break;
            case 'monthly':
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                $periodLabel = 'This Month';
                break;
            case 'yearly':
                $startDate = $now->copy()->startOfYear();
                $endDate = $now->copy()->endOfYear();
                $periodLabel = 'This Year';
                break;
            case 'custom':
                $startDate = $startDateInput ? Carbon::parse($startDateInput)->startOfDay() : $now->copy()->startOfDay();
                $endDate = $endDateInput ? Carbon::parse($endDateInput)->endOfDay() : $now->copy()->endOfDay();
                $periodLabel = 'Custom Range';
                break;
            case 'daily':
            default:
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                $periodLabel = 'Today';
                break;
        }

        $query = ActivityLog::with('user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where(function ($q) {
                $q->whereHas('user', function ($userQuery) {
                    $userQuery->whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN]);
                })->orWhereNull('user_id');
            })
            ->orderByDesc('created_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('role') && $request->role !== 'all') {
            $role = $request->role;
            $query->whereHas('user', function ($q) use ($role) {
                $q->where('role', $role);
            });
        }

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }

        $logs = $query->get();

        $totalLogs = $logs->count();
        $generatedAt = Carbon::now();

        $pdf = Pdf::loadView('reports.activity-logs-pdf', [
            'logs' => $logs,
            'totalLogs' => $totalLogs,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'period' => $period,
            'periodLabel' => $periodLabel,
            'generatedAt' => $generatedAt,
            'printedBy' => $user ? $user->name : 'System',
        ])->setPaper('a4', 'portrait');

        $filename = 'activity-logs-' . $generatedAt->format('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }
}
