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
            // Add delivery fields if they don't exist
            if (!Schema::hasColumn('orders', 'delivery_barangay')) {
                $table->string('delivery_barangay')->nullable()->after('delivery_address');
            }
            if (!Schema::hasColumn('orders', 'delivery_city')) {
                $table->string('delivery_city')->nullable()->after('delivery_barangay');
            }
            if (!Schema::hasColumn('orders', 'delivery_instructions')) {
                $table->text('delivery_instructions')->nullable()->after('delivery_city');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_barangay', 'delivery_city', 'delivery_instructions']);
        });
    }
};
