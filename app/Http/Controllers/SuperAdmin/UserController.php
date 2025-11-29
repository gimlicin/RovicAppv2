<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by email verification status
        if ($request->filled('verified')) {
            if ($request->verified === 'verified') {
                $query->whereNotNull('email_verified_at');
            } elseif ($request->verified === 'unverified') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_users' => User::count(),
            'total_customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
            'total_admins' => User::where('role', User::ROLE_ADMIN)->count(),
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
        ];

        return Inertia::render('SuperAdmin/Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'role', 'verified']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('SuperAdmin/Users/Create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::min(8)->letters()->numbers()->mixedCase()],
            'role' => ['required', 'in:' . User::ROLE_CUSTOMER . ',' . User::ROLE_ADMIN],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        // Prevent creation of super admin users
        if ($request->role === User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'You cannot create Super Admin users.']);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        // Trigger email verification
        event(new Registered($user));

        ActivityLogger::log(
            'user_created',
            "Created user: {$user->email} ({$user->role})",
            $user
        );

        return redirect()->route('super-admin.users.index')
            ->with('success', 'User created successfully! Verification email sent.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        // Prevent editing super admin users
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot edit Super Admin users.');
        }

        return Inertia::render('SuperAdmin/Users/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        // Prevent editing super admin users
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot edit Super Admin users.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $user->id,
            'role' => ['required', 'in:' . User::ROLE_CUSTOMER . ',' . User::ROLE_ADMIN],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        // Prevent changing to super admin
        if ($request->role === User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'You cannot change a user to Super Admin.']);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        // If password is provided, update it
        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', 'confirmed', Rules\Password::min(8)->letters()->numbers()->mixedCase()],
            ]);
            
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        ActivityLogger::log(
            'user_updated',
            "Updated user: {$user->email} ({$user->role})",
            $user
        );

        return redirect()->route('super-admin.users.index')
            ->with('success', 'User updated successfully!');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting super admin users
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot delete Super Admin users.');
        }

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }
        $email = $user->email;
        $role = $user->role;

        $user->delete();

        ActivityLogger::log(
            'user_deleted',
            "Deleted user: {$email} ({$role})",
            $user
        );

        return redirect()->route('super-admin.users.index')
            ->with('success', 'User deleted successfully!');
    }

    /**
     * Toggle user email verification status.
     */
    public function toggleVerification(User $user)
    {
        if ($user->isSuperAdmin()) {
            abort(403, 'Cannot modify Super Admin users.');
        }

        if ($user->hasVerifiedEmail()) {
            $user->forceFill(['email_verified_at' => null])->save();
            $message = 'Email verification removed.';
        } else {
            $user->forceFill(['email_verified_at' => now()])->save();
            $message = 'Email verified successfully.';
        }

        ActivityLogger::log(
            'user_verification_toggled',
            $message . ' (' . $user->email . ')',
            $user
        );

        return back()->with('success', $message);
    }
}
