<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Frozen Meats',
                'slug' => 'frozen-meats',
                'icon' => '🥩',
                'description' => 'Premium frozen meat products including beef, pork, and chicken cuts'
            ],
            [
                'name' => 'Processed Items',
                'slug' => 'processed-items',
                'icon' => '🌭',
                'description' => 'Delicious processed meat products like sausages, ham, and bacon'
            ],
            [
                'name' => 'Fresh Cuts',
                'slug' => 'fresh-cuts',
                'icon' => '🥓',
                'description' => 'Fresh daily cuts of premium quality meats'
            ],
            [
                'name' => 'Specialty Items',
                'slug' => 'specialty-items',
                'icon' => '⭐',
                'description' => 'Special and seasonal meat products'
            ]
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']], // Search by slug
                $category // Create or update with these values
            );
        }
    }
}
