import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Download } from 'lucide-react';

interface FiltersProps {
  period?: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface Props {
  filters: FiltersProps;
}

function OrdersReport({ filters }: Props) {
  const [period, setPeriod] = useState<string>(filters.period || 'daily');
  const [startDate, setStartDate] = useState<string>(filters.start_date || '');
  const [endDate, setEndDate] = useState<string>(filters.end_date || '');

  const isCustom = period === 'custom';

  return (
    <>
      <Head title="Reports - Orders" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Reports</h1>
            <p className="text-muted-foreground">
              Export tamper-resistant PDF reports with filters and client payment details.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generate Order List PDF</CardTitle>
                <CardDescription>
                  Choose a period and download the official PDF report with reference numbers.
                </CardDescription>
              </div>
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <form
              method="GET"
              action="/super-admin/reports/orders/pdf"
              target="_blank"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-1">
                  <label htmlFor="period" className="text-sm font-medium">
                    Period
                  </label>
                  <select
                    id="period"
                    name="period"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="daily">Today</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {isCustom && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="start_date" className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Start Date
                      </label>
                      <input
                        id="start_date"
                        name="start_date"
                        type="date"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="end_date" className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        End Date
                      </label>
                      <input
                        id="end_date"
                        name="end_date"
                        type="date"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 flex-col sm:flex-row">
                <p className="text-sm text-muted-foreground max-w-xl">
                  The generated PDF includes order list, customer details, payment status, and payment reference
                  numbers. It is intended as a tamper-resistant snapshot for the selected period.
                </p>

                <Button type="submit" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

OrdersReport.layout = (page: React.ReactElement) => <AppLayout>{page}</AppLayout>;

export default OrdersReport;
