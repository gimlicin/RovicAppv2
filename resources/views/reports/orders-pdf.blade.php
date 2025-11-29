<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order List Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h1, h2, h3 { margin: 0; }
        .header { text-align: center; margin-bottom: 16px; }
        .meta { font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f3f3f3; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .small { font-size: 10px; }
        .chart-section { font-size: 11px; margin-bottom: 12px; }
        .chart-title { font-weight: bold; margin-bottom: 4px; }
        .chart-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .chart-table th, .chart-table td { border: none; padding: 2px 4px; }
        .bar-container { background: #f3f3f3; border-radius: 3px; height: 10px; }
        .bar { height: 10px; border-radius: 3px; }
        .orders-bar { background: #4b9fff; }
        .revenue-bar { background: #22c55e; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RovicApp - Order List Report</h1>
        <p class="small">E-commerce System</p>
    </div>

    <div class="meta">
        <div><strong>Period:</strong> {{ $periodLabel }} ({{ $startDate->format('Y-m-d') }} to {{ $endDate->format('Y-m-d') }})</div>
        <div><strong>Printed by:</strong> {{ $printedBy }}</div>
        <div><strong>Generated at:</strong> {{ $generatedAt->format('Y-m-d H:i:s') }}</div>
        <div><strong>Total Orders:</strong> {{ $totalOrders }} | <strong>Total Revenue:</strong> ₱{{ number_format($totalRevenue, 2) }}</div>
    </div>

    @if (!empty($dailyStats))
        <div class="chart-section">
            <div class="chart-title">Order & Revenue Trends (per day)</div>
            <table class="chart-table">
                <thead>
                    <tr>
                        <th class="small">Date</th>
                        <th class="small">Orders</th>
                        <th class="small text-right">#</th>
                        <th class="small">Revenue</th>
                        <th class="small text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($dailyStats as $date => $stats)
                        @php
                            $ordersWidth = 0;
                            $revenueWidth = 0;
                            if ($maxOrders > 0) {
                                $ordersWidth = ($stats['orders'] / $maxOrders) * 100;
                            }
                            if ($maxRevenue > 0) {
                                $revenueWidth = ($stats['revenue'] / $maxRevenue) * 100;
                            }
                            $ordersWidth = max(5, min(100, $ordersWidth));
                            $revenueWidth = max(5, min(100, $revenueWidth));
                        @endphp
                        <tr>
                            <td class="small">{{ $date }}</td>
                            <td>
                                <div class="bar-container">
                                    <div class="bar orders-bar" style="width: {{ $ordersWidth }}%;"></div>
                                </div>
                            </td>
                            <td class="small text-right">{{ $stats['orders'] }}</td>
                            <td>
                                <div class="bar-container">
                                    <div class="bar revenue-bar" style="width: {{ $revenueWidth }}%;"></div>
                                </div>
                            </td>
                            <td class="small text-right">₱{{ number_format($stats['revenue'], 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Ref #</th>
                <th class="text-right">Total Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($orders as $index => $order)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $order->id }}</td>
                    <td>{{ $order->created_at?->format('Y-m-d H:i') }}</td>
                    <td>{{ $order->customer_name }}</td>
                    <td>{{ $order->customer_phone }}</td>
                    <td>{{ $order->status_label ?? ucfirst($order->status) }}</td>
                    <td>{{ ucfirst($order->payment_method) }} / {{ ucfirst($order->payment_status) }}</td>
                    <td>{{ $order->payment_reference ?: '-' }}</td>
                    <td class="text-right">₱{{ number_format($order->total_amount, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="text-center">No orders found for this period.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p class="small" style="margin-top: 16px;">
        This PDF is generated by the system based on the current database records and is intended as a tamper-resistant snapshot of orders for the selected period.
    </p>
</body>
</html>
