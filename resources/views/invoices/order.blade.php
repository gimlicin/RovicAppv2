<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{ $order->order_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #dc2626;
        }
        .header h1 {
            color: #dc2626;
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            font-size: 11px;
        }
        .invoice-info {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .invoice-info .left,
        .invoice-info .right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .invoice-info h3 {
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .invoice-info p {
            margin: 5px 0;
            font-size: 11px;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table thead {
            background-color: #dc2626;
            color: white;
        }
        table th {
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }
        table tbody tr:hover {
            background-color: #f9f9f9;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 20px;
            float: right;
            width: 300px;
        }
        .totals table {
            margin-bottom: 0;
        }
        .totals td {
            border: none;
            padding: 5px 10px;
        }
        .totals .grand-total {
            background-color: #dc2626;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success {
            background-color: #10b981;
            color: white;
        }
        .badge-warning {
            background-color: #f59e0b;
            color: white;
        }
        .badge-info {
            background-color: #3b82f6;
            color: white;
        }
        .badge-danger {
            background-color: #ef4444;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>ROVIC MEAT PRODUCTS</h1>
            <p>San Roque, Marikina City, Philippines 1812</p>
            <p>Phone: 0936 554 3854 | Email: Kenrivbuslon2@gmail.com</p>
        </div>

        <!-- Invoice Info -->
        <div class="invoice-info">
            <div class="left">
                <h3>Invoice To:</h3>
                <p><span class="label">Customer:</span> {{ $order->customer_name ?: ($order->user->name ?? 'Guest') }}</p>
                @if($order->customer_email || $order->user)
                    <p><span class="label">Email:</span> {{ $order->customer_email ?: ($order->user->email ?? 'N/A') }}</p>
                @endif
                @if($order->customer_phone)
                    <p><span class="label">Phone:</span> {{ $order->customer_phone }}</p>
                @endif
                @if($order->pickup_or_delivery === 'delivery')
                    @php
                        $addressParts = array_filter([
                            $order->delivery_address,
                            $order->delivery_barangay,
                            $order->delivery_city,
                        ]);
                    @endphp
                    <p><span class="label">Delivery Address:</span><br>
                    {{ implode(', ', $addressParts) }}</p>
                @endif
            </div>
            <div class="right" style="text-align: right;">
                <h3>Invoice Details:</h3>
                <p><span class="label">Invoice #:</span> {{ $order->order_number }}</p>
                <p><span class="label">Date:</span> {{ $order->created_at->format('F d, Y') }}</p>
                <p><span class="label">Payment:</span> {{ ucfirst($order->payment_method) }}</p>
                @if($order->payment_reference)
                    <p><span class="label">Reference:</span> {{ $order->payment_reference }}</p>
                @endif
                <p><span class="label">Delivery:</span> {{ ucfirst($order->pickup_or_delivery) }}</p>
                @if($order->is_bulk_order)
                    <p><span class="badge badge-info">Bulk Order</span></p>
                @endif
                @if($order->is_senior_discount)
                    <p><span class="badge badge-success">Senior/PWD Discount</span></p>
                @endif
            </div>
        </div>

        <!-- Order Items -->
        <h3 style="color: #dc2626; margin-bottom: 10px;">Order Items</h3>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th class="text-right">Weight/Unit</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->orderItems as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if($item->notes)
                            <br><small style="color: #666;">Note: {{ $item->notes }}</small>
                        @endif
                    </td>
                    <td class="text-right">{{ $item->product->weight ?? 0 }} {{ $item->product->unit ?? 'kg' }}</td>
                    <td class="text-right">₱{{ number_format($item->price, 2) }}</td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">₱{{ number_format($item->quantity * $item->price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <table>
                <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td class="text-right">₱{{ number_format($order->subtotal ?? $order->total_amount, 2) }}</td>
                </tr>
                @if($order->discount_amount > 0)
                <tr>
                    <td><strong>Senior/PWD Discount:</strong></td>
                    <td class="text-right">-₱{{ number_format($order->discount_amount, 2) }}</td>
                </tr>
                @endif
                <tr class="grand-total">
                    <td><strong>Total Amount:</strong></td>
                    <td class="text-right"><strong>₱{{ number_format($order->total_amount, 2) }}</strong></td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>For any questions about this invoice, please contact us at 0936 554 3854 or Kenrivbuslon2@gmail.com</p>
            <p style="margin-top: 10px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </div>

    <script>
        window.onload = function () {
            window.print();
        };
    </script>
</body>
</html>
