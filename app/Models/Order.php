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
        'is_returned',
        'total_amount', // REVERT: Production database has 'total_amount'
        'pickup_or_delivery',
        'notes',
        'customer_name',
        'customer_phone',
        'customer_email',
        'delivery_address',
        'delivery_barangay',
        'delivery_city',
        'delivery_instructions',
        'scheduled_date',
        'is_bulk_order',
        'payment_method',
        'payment_proof_path',
        'payment_reference',
        'payment_status',
        'payment_rejection_reason',
        'payment_submitted_at',
        'payment_approved_at',
        'payment_approved_by',
        'is_senior_discount',
        'is_senior_citizen', // Alias for is_senior_discount from checkout form
        'discount_type',
        'discount_amount',
        'senior_id_verified',
        'verification_notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2', // REVERT: Match production database
        'scheduled_date' => 'datetime',
        'is_bulk_order' => 'boolean',
        'is_senior_citizen' => 'boolean',
        'payment_submitted_at' => 'datetime',
        'payment_approved_at' => 'datetime',
        'is_senior_discount' => 'boolean',
        'discount_amount' => 'decimal:2',
        'senior_id_verified' => 'boolean',
        'is_returned' => 'boolean',
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
    const STATUS_RETURNED = 'returned';

    // Simplified statuses for Phase 5 workflow (alias to existing payment_* values)
    // Under the hood we store "payment_approved" / "payment_rejected" which are already allowed
    const STATUS_APPROVED = 'payment_approved';
    const STATUS_REJECTED = 'payment_rejected';

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
            self::STATUS_PAYMENT_APPROVED, self::STATUS_APPROVED => 'Approved',
            self::STATUS_PAYMENT_REJECTED, self::STATUS_REJECTED => 'Rejected',
            self::STATUS_CONFIRMED => 'Confirmed',
            self::STATUS_PREPARING => 'Preparing',
            self::STATUS_READY => 'Ready for ' . ucfirst($this->pickup_or_delivery),
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => $this->is_returned ? 'Returned' : 'Cancelled',
            self::STATUS_RETURNED => 'Returned',
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
     * Phase 5 simplified workflow with 8 statuses
     */
    public function getAllowedNextStatuses(): array
    {
        return match($this->status) {
            // PENDING - can approve, reject, or cancel
            self::STATUS_PENDING => [
                self::STATUS_APPROVED,
                self::STATUS_REJECTED,
                self::STATUS_CANCELLED,
            ],
            // APPROVED - can start preparing or cancel
            self::STATUS_APPROVED => [
                self::STATUS_PREPARING,
                self::STATUS_CANCELLED,
            ],
            // PREPARING - can mark as ready or cancel
            self::STATUS_PREPARING => [
                self::STATUS_READY,
                self::STATUS_CANCELLED,
            ],
            // READY - can complete or cancel
            self::STATUS_READY => [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
            ],
            // COMPLETED - can process return (no more status changes after return)
            self::STATUS_COMPLETED => [
                self::STATUS_RETURNED,
            ],
            // RETURNED, CANCELLED, REJECTED - terminal states, no actions
            self::STATUS_RETURNED, 
            self::STATUS_CANCELLED, 
            self::STATUS_REJECTED => [],
            // Legacy statuses for backward compatibility
            self::STATUS_PAYMENT_SUBMITTED => [
                self::STATUS_APPROVED,
                self::STATUS_REJECTED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PAYMENT_APPROVED, self::STATUS_CONFIRMED => [
                self::STATUS_PREPARING,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PAYMENT_REJECTED => [
                self::STATUS_REJECTED,
            ],
            self::STATUS_READY_FOR_PICKUP, self::STATUS_READY_FOR_DELIVERY => [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
            ],
            default => [],
        };
    }

    /**
     * Check if a status transition is allowed
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $allowedStatuses = $this->getAllowedNextStatuses();
        return in_array($newStatus, $allowedStatuses);
    }

    /**
     * Get human-readable status transition labels (Phase 5 workflow)
     */
    public function getNextStatusOptions(): array
    {
        $allowedStatuses = $this->getAllowedNextStatuses();
        $options = [];

        foreach ($allowedStatuses as $status) {
            $options[$status] = match($status) {
                self::STATUS_APPROVED => 'Approve Payment',
                self::STATUS_REJECTED => 'Reject Payment',
                self::STATUS_PREPARING => 'Mark as Preparing',
                self::STATUS_READY => 'Mark as Ready',
                self::STATUS_COMPLETED => 'Complete Order',
                self::STATUS_CANCELLED => 'Cancel Order',
                self::STATUS_RETURNED => 'Process Return',
                // Legacy statuses
                self::STATUS_CONFIRMED => 'Confirm Order',
                self::STATUS_READY_FOR_PICKUP => 'Ready for Pickup',
                self::STATUS_READY_FOR_DELIVERY => 'Ready for Delivery',
                self::STATUS_PAYMENT_APPROVED => 'Approve Payment',
                self::STATUS_PAYMENT_REJECTED => 'Reject Payment',
                self::STATUS_PAYMENT_SUBMITTED => 'Resubmit Payment',
                default => ucfirst(str_replace('_', ' ', $status)),
            };
        }

        return $options;
    }

    /**
     * Check if order is in a final state (Phase 5)
     */
    public function isFinalStatus(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED, 
            self::STATUS_CANCELLED, 
            self::STATUS_RETURNED, 
            self::STATUS_REJECTED
        ]);
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
     * Computed invoice/order number.
     * Format: RMP-10000, RMP-10001, ... where 10000 maps to id=1.
     */
    public function getOrderNumberAttribute(): ?string
    {
        if (!$this->id) {
            return null;
        }

        $base = 10000; // First numeric invoice sequence
        $numeric = $base + $this->id - 1;

        return 'RMP-' . $numeric;
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
