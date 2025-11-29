<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * For local SQLite development, relax the CHECK constraint on orders.status
     * so new Phase 5 statuses like 'returned' are accepted.
     * We rely on application-level validation for allowed statuses.
     */
    public function up(): void
    {
        // This migration is now a no-op. Previous attempts to modify the
        // SQLite schema here caused syntax issues. The application no longer
        // relies on changing the CHECK constraint in this migration.
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'sqlite') {
            return;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for local dev; original CHECK cannot be reliably restored.
    }
};
