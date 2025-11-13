<?php
// EMERGENCY SIMPLE ORDER CREATION METHOD
// Replace the store() method in OrderController.php with this:

public function store(StoreOrderRequest $request)
{
    \Log::info('Simple order creation attempt');
    
    try {
        $validated = $request->validated();
        
        // Calculate simple total
        $totalPrice = 0;
        foreach ($validated['cart_items'] as $item) {
            $product = Product::find($item['product_id']);
            if ($product) {
                $totalPrice += $product->price * $item['quantity'];
            }
        }
        
        // Create order with minimal fields
        $order = Order::create([
            'user_id' => auth()->id(),
            'status' => 'pending',
            'total_price' => $totalPrice, // Try total_amount if total_price fails
            'pickup_or_delivery' => $validated['pickup_or_delivery'],
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'payment_method' => $validated['payment_method'] ?? 'cash',
            'payment_status' => 'pending',
        ]);
        
        // Create order items
        foreach ($validated['cart_items'] as $item) {
            $product = Product::find($item['product_id']);
            if ($product) {
                $order->orderItems()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total_price' => $product->price * $item['quantity'],
                ]);
            }
        }
        
        \Log::info('Order created successfully', ['order_id' => $order->id]);
        
        // Simple redirect
        return redirect()->route('order.confirmation', $order)
            ->with('success', 'Order placed successfully!');
            
    } catch (\Exception $e) {
        \Log::error('Order creation failed: ' . $e->getMessage());
        
        return redirect()->back()
            ->withErrors(['order' => 'Order failed: ' . $e->getMessage()])
            ->withInput();
    }
}
