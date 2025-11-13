<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $frozenMeats = Category::where('slug', 'frozen-meats')->first();
        $processedItems = Category::where('slug', 'processed-items')->first();
        $freshCuts = Category::where('slug', 'fresh-cuts')->first();
        $specialtyItems = Category::where('slug', 'specialty-items')->first();

        $products = [
            // Frozen Meats
            [
                'name' => 'Premium Beef Ribeye',
                'description' => 'Premium quality frozen beef ribeye steaks, perfect for grilling',
                'price' => 850.00,
                'category_id' => $frozenMeats->id,
                'is_best_seller' => true,
                'stock_quantity' => 50,
                'weight' => 0.5,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Frozen Chicken Breast',
                'description' => 'Fresh frozen chicken breast fillets, boneless and skinless',
                'price' => 320.00,
                'category_id' => $frozenMeats->id,
                'is_best_seller' => true,
                'stock_quantity' => 100,
                'weight' => 1.0,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Pork Belly Slices',
                'description' => 'Premium pork belly slices, perfect for samgyupsal',
                'price' => 450.00,
                'category_id' => $frozenMeats->id,
                'is_best_seller' => false,
                'stock_quantity' => 75,
                'weight' => 0.5,
                'unit' => 'kg',
                'is_active' => true,
            ],

            // Processed Items
            [
                'name' => 'Hungarian Sausage',
                'description' => 'Authentic Hungarian-style sausages with premium spices',
                'price' => 280.00,
                'category_id' => $processedItems->id,
                'is_best_seller' => true,
                'stock_quantity' => 60,
                'weight' => 0.5,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Smoked Ham',
                'description' => 'Delicious smoked ham, perfect for breakfast or sandwiches',
                'price' => 380.00,
                'category_id' => $processedItems->id,
                'is_best_seller' => false,
                'stock_quantity' => 40,
                'weight' => 0.3,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Bacon Strips',
                'description' => 'Premium bacon strips, crispy and flavorful',
                'price' => 420.00,
                'category_id' => $processedItems->id,
                'is_best_seller' => true,
                'stock_quantity' => 80,
                'weight' => 0.25,
                'unit' => 'kg',
                'is_active' => true,
            ],

            // Fresh Cuts
            [
                'name' => 'Fresh Beef Tenderloin',
                'description' => 'Premium fresh beef tenderloin, butchered daily',
                'price' => 1200.00,
                'category_id' => $freshCuts->id,
                'is_best_seller' => false,
                'stock_quantity' => 20,
                'weight' => 0.5,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Fresh Pork Chops',
                'description' => 'Fresh pork chops with bone, perfect for grilling',
                'price' => 350.00,
                'category_id' => $freshCuts->id,
                'is_best_seller' => false,
                'stock_quantity' => 45,
                'weight' => 0.5,
                'unit' => 'kg',
                'is_active' => true,
            ],

            // Specialty Items
            [
                'name' => 'Wagyu Beef Strips',
                'description' => 'Premium Wagyu beef strips, limited availability',
                'price' => 2500.00,
                'category_id' => $specialtyItems->id,
                'is_best_seller' => false,
                'stock_quantity' => 10,
                'weight' => 0.3,
                'unit' => 'kg',
                'is_active' => true,
            ],
            [
                'name' => 'Organic Free-Range Chicken',
                'description' => 'Organic free-range whole chicken, hormone-free',
                'price' => 480.00,
                'category_id' => $specialtyItems->id,
                'is_best_seller' => false,
                'stock_quantity' => 25,
                'weight' => 1.5,
                'unit' => 'kg',
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                ['name' => $product['name']], // Search by name
                $product // Create or update with these values
            );
        }
    }
}
