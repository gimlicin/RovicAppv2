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
        // For SQLite: No schema change needed - role column is a string field
        // super_admin is now allowed as a valid role value in the application logic
        
        // For MySQL (when deploying to production), use this instead:
        // \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'wholesaler', 'admin', 'super_admin') NOT NULL DEFAULT 'customer'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete any super_admin users
        \DB::table('users')->where('role', 'super_admin')->delete();
        
        // For MySQL (when deploying to production), also run:
        // \DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'wholesaler', 'admin') NOT NULL DEFAULT 'customer'");
    }
};
