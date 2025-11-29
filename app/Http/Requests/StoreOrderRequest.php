<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow guest orders
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:255',
            'customer_phone' => ['required', 'digits:11'],
            'customer_email' => 'nullable|email|max:255',
            'pickup_or_delivery' => 'required|in:pickup,delivery',
            'delivery_address' => 'required_if:pickup_or_delivery,delivery|nullable|string|max:500',
            'scheduled_date' => 'nullable|date|after:now',
            'notes' => 'nullable|string|max:1000',
            'is_bulk_order' => 'boolean',
            'is_senior_citizen' => 'boolean',
            'cart_items' => 'required|array|min:1',
            'cart_items.*.product_id' => 'required|exists:products,id',
            'cart_items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    // Extract product_id from the attribute path (e.g., cart_items.0.quantity -> cart_items.0.product_id)
                    $productIdAttribute = str_replace('.quantity', '.product_id', $attribute);
                    $productId = $this->input($productIdAttribute);
                    
                    if ($productId) {
                        $product = \App\Models\Product::find($productId);
                        if ($product) {
                            $maxOrderable = $product->getMaxOrderableQuantity();
                            if ($value > $maxOrderable) {
                                $fail("Maximum orderable quantity for {$product->name} is {$maxOrderable}.");
                            }
                        }
                    }
                }
            ],
            'cart_items.*.notes' => 'nullable|string|max:255',
            'payment_method' => 'required|in:qr,cash',
            'payment_proof' => 'required_if:payment_method,qr|nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
            'terms_accepted' => 'required|accepted'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Customer name is required.',
            'customer_phone.required' => 'Phone number is required.',
            'customer_phone.digits' => 'Phone number must be exactly 11 digits.',
            'pickup_or_delivery.required' => 'Please select pickup or delivery.',
            'pickup_or_delivery.in' => 'Please select either pickup or delivery.',
            'delivery_address.required_if' => 'Delivery address is required for delivery orders.',
            'scheduled_date.after' => 'Scheduled date must be in the future.',
            'cart_items.required' => 'Cart cannot be empty.',
            'cart_items.min' => 'At least one item is required.',
            'cart_items.*.product_id.exists' => 'Selected product does not exist.',
            'cart_items.*.quantity.min' => 'Quantity must be at least 1.',
            'cart_items.*.quantity.max' => 'Maximum quantity per item is 999.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'Please select a valid payment method.',
            'payment_proof.required_if' => 'Payment proof is required for QR code payments.',
            'payment_proof.image' => 'Payment proof must be an image file.',
            'payment_proof.mimes' => 'Payment proof must be a JPEG, PNG, JPG, or GIF file.',
            'payment_proof.max' => 'Payment proof file size must not exceed 10MB.',
            'terms_accepted.required' => 'You must accept the terms and conditions to proceed.',
            'terms_accepted.accepted' => 'You must accept the terms and conditions to proceed.',
        ];
    }
}
