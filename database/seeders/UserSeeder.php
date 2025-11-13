<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@rovicmeat.com',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
                'phone' => '+63 912 345 6789',
                'address' => 'Rovic Meat Products Main Office',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'John Customer',
                'email' => 'customer@example.com',
                'password' => Hash::make('password'),
                'role' => User::ROLE_CUSTOMER,
                'phone' => '+63 917 123 4567',
                'address' => '123 Sample Street, Manila',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Maria Wholesaler',
                'email' => 'wholesaler@example.com',
                'password' => Hash::make('password'),
                'role' => User::ROLE_WHOLESALER,
                'phone' => '+63 918 987 6543',
                'address' => '456 Business Ave, Quezon City',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']], // Search by email
                $user // Create or update with these values
            );
        }
    }
}
