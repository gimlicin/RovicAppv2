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
        // Add base64 field to orders table for payment proofs
        Schema::table('orders', function (Blueprint $table) {
            $table->longText('payment_proof_base64')->nullable()->after('payment_proof_path');
        });
        
        // Add base64 field to payment_settings table for QR codes
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->longText('qr_code_base64')->nullable()->after('qr_code_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_proof_base64');
        });
        
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->dropColumn('qr_code_base64');
        });
    }
};
