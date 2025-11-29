<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if super admin already exists
        $superAdminExists = User::where('role', User::ROLE_SUPER_ADMIN)->exists();

        if (!$superAdminExists) {
            User::create([
                'name' => 'Super Administrator',
                'email' => 'superadmin@rovicapp.com',
                'password' => Hash::make('superadmin123'), // Change this in production!
                'role' => User::ROLE_SUPER_ADMIN,
                'email_verified_at' => now(), // Auto-verify for initial super admin
            ]);

            $this->command->info('Super Admin user created successfully!');
            $this->command->info('Email: superadmin@rovicapp.com');
            $this->command->info('Password: superadmin123');
            $this->command->warn('⚠️  Please change the password after first login!');
        } else {
            $this->command->info('Super Admin already exists. Skipping...');
        }
    }
}
