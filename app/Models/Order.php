<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'total_amount', // If this fails, try changing to 'total_price'
        'pickup_or_delivery',
        'notes',
        'customer_name',
        'customer_phone',
        'customer_email',
        'delivery_address',
        'scheduled_date',
        'is_bulk_order',
        'payment_method',
        'payment_proof_path',
        'payment_status',
        'payment_rejection_reason',
        'payment_submitted_at',
        'payment_approved_at',
        'payment_approved_by',
        'is_senior_discount',
        'discount_type',
        'discount_amount',
        'senior_id_verified',
        'verification_notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'scheduled_date' => 'datetime',
        'is_bulk_order' => 'boolean',
        'payment_submitted_at' => 'datetime',
        'payment_approved_at' => 'datetime',
        'is_senior_discount' => 'boolean',
        'discount_amount' => 'decimal:2',
        'senior_id_verified' => 'boolean',
    ];

    protected $appends = [
        'payment_proof',
        'status_label'
    ];

    public function getPaymentProofAttribute()
    {
        return $this->payment_proof_path;
    }

    // Order statuses
    const STATUS_PENDING = 'pending';
    const STATUS_AWAITING_PAYMENT = 'awaiting_payment';
    const STATUS_PAYMENT_SUBMITTED = 'payment_submitted';
    const STATUS_PAYMENT_APPROVED = 'payment_approved';
    const STATUS_PAYMENT_REJECTED = 'payment_rejected';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PREPARING = 'preparing';
    const STATUS_READY = 'ready'; // Keep for backward compatibility
    const STATUS_READY_FOR_PICKUP = 'ready_for_pickup';
    const STATUS_READY_FOR_DELIVERY = 'ready_for_delivery';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    // Payment methods
    const PAYMENT_QR = 'qr';
    const PAYMENT_CASH = 'cash';

    // Payment statuses
    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_SUBMITTED = 'submitted';
    const PAYMENT_STATUS_APPROVED = 'approved';
    const PAYMENT_STATUS_REJECTED = 'rejected';

    // Delivery options
    const PICKUP = 'pickup';
    const DELIVERY = 'delivery';

    // Relationship with User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relationship with Order Items
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // Relationship with Payment Approver
    public function paymentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_approved_by');
    }

    // Scopes for filtering
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeBulkOrders($query)
    {
        return $query->where('is_bulk_order', true);
    }

    public function scopeForDelivery($query)
    {
        return $query->where('pickup_or_delivery', self::DELIVERY);
    }

    public function scopeForPickup($query)
    {
        return $query->where('pickup_or_delivery', self::PICKUP);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    // Helper methods for payment status
    public function isPaymentPending(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PENDING;
    }

    public function isPaymentSubmitted(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_SUBMITTED;
    }

    public function isPaymentApproved(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_APPROVED;
    }

    public function isPaymentRejected(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_REJECTED;
    }

    public function requiresPaymentProof(): bool
    {
        return $this->payment_method === self::PAYMENT_QR;
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_AWAITING_PAYMENT => 'Awaiting Payment',
            self::STATUS_PAYMENT_SUBMITTED => 'Payment Submitted',
            self::STATUS_PAYMENT_APPROVED => 'Payment Approved',
            self::STATUS_PAYMENT_REJECTED => 'Payment Rejected',
            self::STATUS_CONFIRMED => 'Confirmed',
            self::STATUS_PREPARING => 'Preparing',
            self::STATUS_READY => 'Ready for ' . ucfirst($this->pickup_or_delivery),
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => 'Unknown',
        };
    }

    /**
     * Get applicable ready statuses based on delivery type
     * Using STATUS_READY for production compatibility
     */
    private function getApplicableReadyStatuses(): array
    {
        // Use simple 'ready' status for production compatibility
        // The specific pickup/delivery statuses require database migration
        return [self::STATUS_READY];
    }

    /**
     * Get allowed next statuses based on current status
     */
    public function getAllowedNextStatuses(): array
    {
        return match($this->status) {
            self::STATUS_PENDING => [
                self::STATUS_CONFIRMED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PAYMENT_SUBMITTED => [
                self::STATUS_PAYMENT_APPROVED,
                self::STATUS_PAYMENT_REJECTED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PAYMENT_APPROVED, self::STATUS_CONFIRMED => [
                self::STATUS_PREPARING,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PAYMENT_REJECTED => [
                self::STATUS_PAYMENT_SUBMITTED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PREPARING => [
                // Show only the appropriate ready status based on delivery type
                ...$this->getApplicableReadyStatuses(),
                self::STATUS_READY, // Keep for backward compatibility
                self::STATUS_CANCELLED,
            ],
            self::STATUS_READY, self::STATUS_READY_FOR_PICKUP, self::STATUS_READY_FOR_DELIVERY => [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_COMPLETED, self::STATUS_CANCELLED => [],
            default => [],
        };
    }

    /**
     * Check if a status transition is allowed
     */
    public function canTransitionTo(string $newStatus): bool
    {
        // Can't change completed or cancelled orders
        if (in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED])) {
            return false;
        }

        $allowedStatuses = $this->getAllowedNextStatuses();
        return in_array($newStatus, $allowedStatuses);
    }

    /**
     * Get human-readable status transition labels
     */
    public function getNextStatusOptions(): array
    {
        $allowedStatuses = $this->getAllowedNextStatuses();
        $options = [];

        foreach ($allowedStatuses as $status) {
            $options[$status] = match($status) {
                self::STATUS_CONFIRMED => 'Confirm Order',
                self::STATUS_PREPARING => 'Start Preparing',
                self::STATUS_READY => 'Mark as Ready',
                self::STATUS_READY_FOR_PICKUP => 'Ready for Pickup',
                self::STATUS_READY_FOR_DELIVERY => 'Ready for Delivery',
                self::STATUS_COMPLETED => 'Complete Order',
                self::STATUS_CANCELLED => 'Cancel Order',
                self::STATUS_PAYMENT_APPROVED => 'Approve Payment',
                self::STATUS_PAYMENT_REJECTED => 'Reject Payment',
                self::STATUS_PAYMENT_SUBMITTED => 'Resubmit Payment',
                default => ucfirst(str_replace('_', ' ', $status)),
            };
        }

        return $options;
    }

    /**
     * Check if order is in a final state
     */
    public function isFinalStatus(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return !$this->isFinalStatus() && 
               !in_array($this->status, [self::STATUS_COMPLETED]);
    }

    // Senior Discount Constants
    const DISCOUNT_SENIOR_CITIZEN = 'senior_citizen';
    const SENIOR_DISCOUNT_RATE = 0.20; // 20% as mandated by Philippine law (RA 9994)

    /**
     * Check if order has senior citizen discount
     */
    public function hasSeniorDiscount(): bool
    {
        return $this->is_senior_discount === true;
    }

    /**
     * Calculate senior discount amount
     */
    public static function calculateSeniorDiscount(float $subtotal): float
    {
        return round($subtotal * self::SENIOR_DISCOUNT_RATE, 2);
    }

    /**
     * Get formatted discount amount
     */
    public function getFormattedDiscountAttribute(): string
    {
        if ($this->discount_amount > 0) {
            return '₱' . number_format($this->discount_amount, 2);
        }
        return '₱0.00';
    }

    /**
     * Get subtotal before discount
     */
    public function getSubtotalAttribute(): float
    {
        if ($this->hasSeniorDiscount() && $this->discount_amount > 0) {
            return $this->total_amount + $this->discount_amount;
        }
        return $this->total_amount;
    }
}
