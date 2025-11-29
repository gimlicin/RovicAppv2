<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // Add payment_reference field
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_reference', 100)->nullable()->after('payment_proof_path');
        });
        
        // Update status enum to include 'returned' and 'rejected'
        if ($driver === 'pgsql') {
            // Update PostgreSQL check constraint
            DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            DB::statement("
                ALTER TABLE orders ADD CONSTRAINT orders_status_check 
                CHECK (status IN (
                    'pending', 'awaiting_payment', 'payment_submitted', 
                    'payment_approved', 'payment_rejected', 'confirmed', 
                    'preparing', 'ready', 'ready_for_pickup', 
                    'ready_for_delivery', 'completed', 'cancelled', 'returned', 'rejected', 'approved'
                ))
            ");
        } elseif ($driver === 'mysql') {
            // MySQL ENUM modification
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
                    'returned',
                    'rejected',
                    'approved'
                ])->default('pending')->change();
            });
        }
        // SQLite uses VARCHAR by default, no enum modification needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // Remove payment_reference field
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_reference');
        });
        
        // Revert status enum (remove 'returned' and 'rejected')
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            DB::statement("
                ALTER TABLE orders ADD CONSTRAINT orders_status_check 
                CHECK (status IN (
                    'pending', 'awaiting_payment', 'payment_submitted', 
                    'payment_approved', 'payment_rejected', 'confirmed', 
                    'preparing', 'ready', 'ready_for_pickup', 
                    'ready_for_delivery', 'completed', 'cancelled'
                ))
            ");
        } elseif ($driver === 'mysql') {
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
                    'cancelled'
                ])->default('pending')->change();
            });
        }
    }
};
