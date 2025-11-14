<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_method',
        'qr_code_path',
        'account_name',
        'account_number',
        'instructions',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Get the full URL for the QR code image.
     */
    public function getQrCodeUrlAttribute(): ?string
    {
        if (!$this->qr_code_path) {
            return null;
        }

        // If it's already a full URL, return it
        if (filter_var($this->qr_code_path, FILTER_VALIDATE_URL)) {
            return $this->qr_code_path;
        }

        // Use route-based serving for better production compatibility
        return route('admin.payment-settings.qr-code', $this->id);
    }

    /**
     * Get the display name for the payment method.
     */
    public function getPaymentMethodNameAttribute(): string
    {
        return match ($this->payment_method) {
            'gcash' => 'GCash',
            'maya' => 'Maya (PayMaya)',
            'bank_transfer' => 'Bank Transfer',
            default => ucfirst(str_replace('_', ' ', $this->payment_method)),
        };
    }

    /**
     * Scope for active payment methods.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordering by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('created_at');
    }
}
