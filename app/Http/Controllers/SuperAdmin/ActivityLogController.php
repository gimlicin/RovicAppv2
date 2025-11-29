<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs for super admins.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')
            ->where(function ($q) {
                $q->whereHas('user', function ($userQuery) {
                    $userQuery->whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN]);
                })->orWhereNull('user_id');
            })
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%");
            });
        }

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

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->paginate(20)->withQueryString();

        $actions = ActivityLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        $users = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('SuperAdmin/ActivityLogs/Index', [
            'logs' => $logs,
            'actions' => $actions,
            'users' => $users,
            'filters' => $request->only(['search', 'user_id', 'role', 'action', 'start_date', 'end_date']),
        ]);
    }
}
