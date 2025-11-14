<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentSettingController extends Controller
{
    /**
     * Display the payment settings page.
     */
    public function index()
    {
        $settings = PaymentSetting::ordered()->get()->map(function ($setting) {
            return [
                'id' => $setting->id,
                'payment_method' => $setting->payment_method,
                'payment_method_name' => $setting->payment_method_name,
                'qr_code_path' => $setting->qr_code_path,
                'qr_code_url' => $setting->qr_code_url,
                'account_name' => $setting->account_name,
                'account_number' => $setting->account_number,
                'instructions' => $setting->instructions,
                'is_active' => $setting->is_active,
                'display_order' => $setting->display_order,
            ];
        });

        return Inertia::render('Admin/Settings/PaymentSettings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Store a new payment setting.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|max:255',
            'qr_code' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        // Handle QR code upload
        $qrCodePath = null;
        if ($request->hasFile('qr_code')) {
            $qrCodePath = $request->file('qr_code')->store('qr_codes', 'public');
        }

        PaymentSetting::create([
            'payment_method' => $validated['payment_method'],
            'qr_code_path' => $qrCodePath,
            'account_name' => $validated['account_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Payment setting created successfully.');
    }

    /**
     * Update an existing payment setting.
     */
    public function update(Request $request, PaymentSetting $paymentSetting)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|max:255',
            'qr_code' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ]);

        // Handle QR code upload
        if ($request->hasFile('qr_code')) {
            // Delete old QR code if exists
            if ($paymentSetting->qr_code_path && Storage::disk('public')->exists($paymentSetting->qr_code_path)) {
                Storage::disk('public')->delete($paymentSetting->qr_code_path);
            }

            $validated['qr_code_path'] = $request->file('qr_code')->store('qr_codes', 'public');
        }

        $paymentSetting->update([
            'payment_method' => $validated['payment_method'],
            'qr_code_path' => $validated['qr_code_path'] ?? $paymentSetting->qr_code_path,
            'account_name' => $validated['account_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'is_active' => $validated['is_active'] ?? $paymentSetting->is_active,
            'display_order' => $validated['display_order'] ?? $paymentSetting->display_order,
        ]);

        return redirect()->back()->with('success', 'Payment setting updated successfully.');
    }

    /**
     * Delete a payment setting.
     */
    public function destroy(PaymentSetting $paymentSetting)
    {
        // Delete QR code file if exists
        if ($paymentSetting->qr_code_path && Storage::disk('public')->exists($paymentSetting->qr_code_path)) {
            Storage::disk('public')->delete($paymentSetting->qr_code_path);
        }

        $paymentSetting->delete();

        return redirect()->back()->with('success', 'Payment setting deleted successfully.');
    }

    /**
     * Toggle active status.
     */
    public function toggleActive(PaymentSetting $paymentSetting)
    {
        $paymentSetting->update([
            'is_active' => !$paymentSetting->is_active,
        ]);

        return redirect()->back()->with('success', 'Payment setting status updated.');
    }

    /**
     * Serve QR code image file
     */
    public function viewQrCode(PaymentSetting $paymentSetting)
    {
        if (!$paymentSetting->qr_code_path) {
            abort(404, 'QR code not found.');
        }

        $path = storage_path('app/public/' . $paymentSetting->qr_code_path);
        
        if (!file_exists($path)) {
            abort(404, 'QR code file not found.');
        }

        return response()->file($path);
    }
}
