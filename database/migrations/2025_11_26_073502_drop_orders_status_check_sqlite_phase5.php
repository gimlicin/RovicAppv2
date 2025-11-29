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

        // This migration is ONLY for local SQLite development.
        // We relax the status CHECK constraint to allow new Phase 5 statuses
        // without having to rebuild the whole table schema.
        if ($driver !== 'sqlite') {
            return;
        }

        $row = DB::selectOne("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'");
        if (!$row || !isset($row->sql)) {
            return;
        }

        $tableSql = $row->sql;

        // Replace any existing CHECK("status" IN (...)) expression with our new list
        $newCheck = 'CHECK("status" IN ('
            . "'pending','awaiting_payment','payment_submitted','payment_approved','payment_rejected',"
            . "'confirmed','preparing','ready','ready_for_pickup','ready_for_delivery','completed','cancelled','approved','rejected','returned'" 
            . '))';

        $updatedSql = preg_replace(
            '/CHECK\s*\(\s*"status"\s+IN\s*\([^)]*\)\s*\)/',
            $newCheck,
            $tableSql
        );

        // If there was no CHECK on status, nothing to do
        if ($updatedSql === null || $updatedSql === $tableSql) {
            return;
        }

        // Danger zone: modify sqlite_master directly (SQLite-approved technique for schema patching)
        DB::statement('PRAGMA writable_schema = 1;');
        DB::update(
            "UPDATE sqlite_master SET sql = ? WHERE type = 'table' AND name = 'orders'",
            [$updatedSql]
        );
        DB::statement('PRAGMA writable_schema = 0;');

        // Rebuild the database file so the new schema SQL takes effect
        DB::statement('VACUUM;');
        DB::statement('PRAGMA integrity_check;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For local dev only; no need to try to restore the old CHECK constraint.
    }
};
