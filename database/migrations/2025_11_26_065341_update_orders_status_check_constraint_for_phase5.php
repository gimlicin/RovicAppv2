<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * SQLite uses CHECK constraint for status validation
     * We need to drop and recreate it to include new Phase 5 statuses
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // For local SQLite development, we now rely on app-level validation
            // and the later migration that patches the status CHECK constraint.
            // Do not rewrite the `orders` table here, as that breaks primary keys
            // and causes foreign key mismatches with `order_items`.
            return;
        } elseif ($driver === 'pgsql') {
            // PostgreSQL: update check constraint
            DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            DB::statement("
                ALTER TABLE orders ADD CONSTRAINT orders_status_check
                CHECK (status IN (
                    'pending', 'awaiting_payment', 'payment_submitted',
                    'payment_approved', 'payment_rejected', 'confirmed',
                    'preparing', 'ready', 'ready_for_pickup',
                    'ready_for_delivery', 'completed', 'cancelled',
                    'approved', 'rejected', 'returned'
                ))
            ");
        } elseif ($driver === 'mysql') {
            // MySQL: Already handled by previous migration
            // Just ensure enum includes new values
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('status', [
                    'pending', 
                    'awaiting_payment',
                    'payment_submitted', 
                    'payment_approved', 
                    'payment_rejected',
                    'confirmed', 
                    'preparing', 
                    'ready',
                    'ready_for_pickup', 
                    'ready_for_delivery', 
                    'completed', 
                    'cancelled',
                    'approved',
                    'rejected',
                    'returned'
                ])->default('pending')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert not necessary - old statuses still work
    }
};
