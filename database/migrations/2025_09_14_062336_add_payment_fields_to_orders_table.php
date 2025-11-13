<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('payment_method', ['qr', 'cash'])->default('qr')->after('is_bulk_order');
            $table->string('payment_proof_path')->nullable()->after('payment_method');
            $table->enum('payment_status', ['pending', 'submitted', 'approved', 'rejected'])->default('pending')->after('payment_proof_path');
            $table->text('payment_rejection_reason')->nullable()->after('payment_status');
            $table->timestamp('payment_submitted_at')->nullable()->after('payment_rejection_reason');
            $table->timestamp('payment_approved_at')->nullable()->after('payment_submitted_at');
            $table->foreignId('payment_approved_by')->nullable()->constrained('users')->after('payment_approved_at');
            
            // Note: Status enum modification moved to 2025_11_12_082842_update_orders_status_enum_for_pickup_delivery.php
            // to avoid PostgreSQL enum change() issues and consolidate status updates
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['payment_approved_by']);
            $table->dropColumn([
                'payment_method',
                'payment_proof_path',
                'payment_status',
                'payment_rejection_reason',
                'payment_submitted_at',
                'payment_approved_at',
                'payment_approved_by'
            ]);
            
            // Note: Status enum revert handled by 2025_11_12_082842_update_orders_status_enum_for_pickup_delivery.php
        });
    }
};
