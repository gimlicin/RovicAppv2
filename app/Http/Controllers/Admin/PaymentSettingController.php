<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Cloudinary\Api\Upload\UploadApi as CloudinaryAPI;

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

        return Inertia::render('SuperAdmin/Settings/PaymentSettings', [
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

        // Handle QR code upload to Cloudinary
        $qrCodeUrl = null;
        if ($request->hasFile('qr_code')) {
            $file = $request->file('qr_code');

            // Upload to Cloudinary
            if (
                class_exists(CloudinaryAPI::class) &&
                config('cloudinary.cloud_name') &&
                config('cloudinary.api_key') &&
                config('cloudinary.api_secret')
            ) {
                try {
                    $cloudinary = new CloudinaryAPI([
                        'cloud' => [
                            'cloud_name' => config('cloudinary.cloud_name'),
                            'api_key' => config('cloudinary.api_key'),
                            'api_secret' => config('cloudinary.api_secret'),
                        ],
                    ]);

                    $uploadResult = $cloudinary->upload($file->getRealPath(), [
                        'folder' => 'rovic_meatshop/qr_codes',
                        'transformation' => [
                            'quality' => 'auto',
                            'fetch_format' => 'auto',
                        ],
                    ]);

                    if (isset($uploadResult['secure_url'])) {
                        $qrCodeUrl = $uploadResult['secure_url'];
                        error_log('✅ QR Code uploaded to Cloudinary: ' . $qrCodeUrl);
                    }
                } catch (\Throwable $e) {
                    error_log('❌ Cloudinary upload failed for QR code: ' . $e->getMessage());
                }
            }

            if (!$qrCodeUrl) {
                // Fallback to local storage
                $qrCodePath = $file->store('qr_codes', 'public');
                $qrCodeUrl = Storage::url($qrCodePath);
                error_log('⚠️ QR Code stored locally as fallback: ' . $qrCodeUrl);
            }
        }

        $setting = PaymentSetting::create([
            'payment_method' => $validated['payment_method'],
            'qr_code_path' => $qrCodeUrl, // Now stores URL instead of path
            'account_name' => $validated['account_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        ActivityLogger::log(
            'payment_setting_created',
            "Created payment setting: {$setting->payment_method}",
            $setting
        );

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

        // Handle QR code upload to Cloudinary
        $qrCodeUrl = $paymentSetting->qr_code_path; // Keep existing URL by default
        
        if ($request->hasFile('qr_code')) {
            $file = $request->file('qr_code');

            if (
                class_exists(CloudinaryAPI::class) &&
                config('cloudinary.cloud_name') &&
                config('cloudinary.api_key') &&
                config('cloudinary.api_secret')
            ) {
                try {
                    // Upload new QR code to Cloudinary
                    $cloudinary = new CloudinaryAPI([
                        'cloud' => [
                            'cloud_name' => config('cloudinary.cloud_name'),
                            'api_key' => config('cloudinary.api_key'),
                            'api_secret' => config('cloudinary.api_secret'),
                        ],
                    ]);
                    
                    $uploadResult = $cloudinary->upload($file->getRealPath(), [
                        'folder' => 'rovic_meatshop/qr_codes',
                        'transformation' => [
                            'quality' => 'auto',
                            'fetch_format' => 'auto',
                        ],
                    ]);
                    
                    if (isset($uploadResult['secure_url'])) {
                        $qrCodeUrl = $uploadResult['secure_url'];
                        error_log('✅ QR Code updated on Cloudinary: ' . $qrCodeUrl);
                    }
                    
                    // Note: Old Cloudinary image will remain but that's okay
                    // Cloudinary has storage management tools to clean up unused images
                } catch (\Throwable $e) {
                    error_log('❌ Cloudinary upload failed for QR code update: ' . $e->getMessage());
                }
            }

            if (!$qrCodeUrl || $qrCodeUrl === $paymentSetting->qr_code_path) {
                // Fallback to local storage
                // Delete old local file if exists
                if ($paymentSetting->qr_code_path && Storage::disk('public')->exists($paymentSetting->qr_code_path)) {
                    Storage::disk('public')->delete($paymentSetting->qr_code_path);
                }
                
                $qrCodePath = $file->store('qr_codes', 'public');
                $qrCodeUrl = Storage::url($qrCodePath);
                error_log('⚠️ QR Code stored locally as fallback: ' . $qrCodeUrl);
            }
        }

        $paymentSetting->update([
            'payment_method' => $validated['payment_method'],
            'qr_code_path' => $qrCodeUrl,
            'account_name' => $validated['account_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'instructions' => $validated['instructions'] ?? null,
            'is_active' => $validated['is_active'] ?? $paymentSetting->is_active,
            'display_order' => $validated['display_order'] ?? $paymentSetting->display_order,
        ]);

        ActivityLogger::log(
            'payment_setting_updated',
            "Updated payment setting: {$paymentSetting->payment_method}",
            $paymentSetting
        );

        return redirect()->back()->with('success', 'Payment setting updated successfully.');
    }

    /**
     * Delete a payment setting.
     */
    public function destroy(PaymentSetting $paymentSetting)
    {
        // Delete QR code file if it's stored locally
        // If it's a Cloudinary URL, we'll leave it (Cloudinary can manage storage)
        if ($paymentSetting->qr_code_path && 
            !str_contains($paymentSetting->qr_code_path, 'cloudinary.com') &&
            Storage::disk('public')->exists($paymentSetting->qr_code_path)) {
            Storage::disk('public')->delete($paymentSetting->qr_code_path);
        }

        $method = $paymentSetting->payment_method;
        $paymentSetting->delete();

        ActivityLogger::log(
            'payment_setting_deleted',
            "Deleted payment setting: {$method}",
            $paymentSetting
        );

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

        ActivityLogger::log(
            'payment_setting_toggle_active',
            ($paymentSetting->is_active ? 'Activated payment setting: ' : 'Deactivated payment setting: ') . $paymentSetting->payment_method,
            $paymentSetting
        );

        return redirect()->back()->with('success', 'Payment setting status updated.');
    }

    /**
     * Serve or redirect to QR code image
     */
    public function viewQrCode(PaymentSetting $paymentSetting)
    {
        if (!$paymentSetting->qr_code_path) {
            abort(404, 'QR code not found.');
        }

        // If it's a Cloudinary URL, redirect to it
        if (str_contains($paymentSetting->qr_code_path, 'cloudinary.com')) {
            return redirect($paymentSetting->qr_code_path);
        }
        
        // If it's a local storage URL, serve the file
        if (str_starts_with($paymentSetting->qr_code_path, '/storage/')) {
            $relativePath = str_replace('/storage/', '', $paymentSetting->qr_code_path);
            $path = storage_path('app/public/' . $relativePath);
            
            if (!file_exists($path)) {
                abort(404, 'QR code file not found.');
            }
            
            return response()->file($path);
        }
        
        // If it's a relative path (old format), try to serve it
        $path = storage_path('app/public/' . $paymentSetting->qr_code_path);
        
        if (!file_exists($path)) {
            abort(404, 'QR code file not found.');
        }

        return response()->file($path);
    }
}
