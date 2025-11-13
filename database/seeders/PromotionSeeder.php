<?php

namespace Database\Seeders;

use App\Models\Promotion;
use Illuminate\Database\Seeder;

class PromotionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $promotions = [
            [
                'title' => 'Grand Opening Sale',
                'description' => 'Get 20% off on all frozen meats! Limited time offer for our grand opening.',
                'is_active' => true,
                'start_date' => now(),
                'end_date' => now()->addDays(30),
                'discount_percentage' => 20.00,
                'priority' => 10,
            ],
            [
                'title' => 'Weekend Special',
                'description' => 'Buy 2 kg of any processed items and get ₱100 off!',
                'is_active' => true,
                'start_date' => now(),
                'end_date' => now()->addDays(7),
                'discount_amount' => 100.00,
                'priority' => 8,
            ],
            [
                'title' => 'Premium Cuts Promo',
                'description' => 'Special pricing on premium beef cuts - perfect for special occasions!',
                'is_active' => true,
                'start_date' => now(),
                'end_date' => now()->addDays(14),
                'discount_percentage' => 15.00,
                'priority' => 6,
            ],
        ];

        foreach ($promotions as $promotion) {
            Promotion::updateOrCreate(
                ['title' => $promotion['title']], // Search by title
                $promotion // Create or update with these values
            );
        }
    }
}
