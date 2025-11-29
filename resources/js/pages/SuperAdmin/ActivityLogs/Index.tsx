import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Filter, Search, User as UserIcon, Clock } from 'lucide-react';

interface ActivityUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ActivityLogItem {
  id: number;
  user_id: number | null;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: ActivityUser | null;
}

interface PaginationData {
  data: ActivityLogItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: { url: string | null; label: string; active: boolean }[];
}

interface Props {
  logs: PaginationData;
  actions: string[];
  users: ActivityUser[];
  filters: {
    search?: string;
    user_id?: number | null;
    role?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
  };
}

function ActivityLogsIndex({ logs, actions, users, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedUser, setSelectedUser] = useState<string>(filters.user_id ? String(filters.user_id) : 'all');
  const [role, setRole] = useState(filters.role || 'all');
  const [action, setAction] = useState(filters.action || 'all');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const applyFilters = () => {
    const params: Record<string, any> = {};

    if (search) params.search = search;
    if (selectedUser !== 'all') params.user_id = selectedUser;
    if (role && role !== 'all') params.role = role;
    if (action && action !== 'all') params.action = action;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    router.get('/super-admin/activity-logs', params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (userRole: string | undefined) => {
    switch (userRole) {
      case 'super_admin':
        return <Badge variant="default" className="bg-purple-600">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="bg-blue-600">Admin</Badge>;
      case 'customer':
        return <Badge variant="secondary">Customer</Badge>;
      default:
        return <Badge variant="outline">System</Badge>;
    }
  };

  const getDeviceBrowserLabel = (userAgent: string | null | undefined) => {
    if (!userAgent) return 'Unknown device';

    const ua = userAgent.toLowerCase();

    let os = 'Unknown OS';
    let deviceType = 'Desktop';

    if (ua.includes('android')) {
      os = 'Android';
      deviceType = 'Mobile';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
      deviceType = 'Mobile';
    } else if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
      os = 'macOS';
    }

    let browser = 'Unknown browser';

    if (ua.includes('edg/')) {
      browser = 'Edge';
    } else if (ua.includes('chrome/')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox/')) {
      browser = 'Firefox';
    } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
      browser = 'Safari';
    }

    return `${deviceType} · ${browser} on ${os}`;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      // Orders
      order_status_updated: 'Order status updated',
      order_payment_approved: 'Payment approved',
      order_payment_rejected: 'Payment rejected',

      // Products
      product_created: 'Product created',
      product_updated: 'Product updated',
      product_deleted: 'Product deleted',
      product_best_selling_toggled: 'Product best-selling status changed',
      product_active_toggled: 'Product visibility changed',
      product_stock_adjusted: 'Product stock adjusted',
      product_bulk_stock_updated: 'Product stock updated (bulk)',

      // Categories
      category_created: 'Category created',
      category_updated: 'Category updated',
      category_deleted: 'Category deleted',
      category_active_toggled: 'Category visibility changed',

      // Payment settings
      payment_setting_created: 'Payment method added',
      payment_setting_updated: 'Payment method updated',
      payment_setting_deleted: 'Payment method deleted',
      payment_setting_active_toggled: 'Payment method visibility changed',

      // Users
      user_created: 'User created',
      user_updated: 'User updated',
      user_deleted: 'User deleted',
      user_verification_toggled: 'User verification updated',
    };

    if (labels[action]) {
      return labels[action];
    }

    // Fallback: turn snake_case into "Title Case"
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const truncate = (value: string | null | undefined, length: number) => {
    if (!value) return '';
    return value.length > length ? value.substring(0, length) + '…' : value;
  };

  return (
    <>
      <Head title="Activity Logs - Super Admin" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-7 w-7" />
              Activity Logs
            </h1>
            <p className="text-muted-foreground">
              Audit trail of important admin and super admin actions.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine logs by user, role, action, and date range.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search description or action key"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">User</label>
                  <Select
                    value={selectedUser}
                    onValueChange={(value) => setSelectedUser(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Action</label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      {actions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">End date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setSelectedUser('all');
                      setRole('all');
                      setAction('all');
                      setStartDate('');
                      setEndDate('');
                      router.get('/super-admin/activity-logs', {}, {
                        preserveState: false,
                        preserveScroll: true,
                      });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>
              {logs.total} total log{logs.total === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Device / Browser</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDateTime(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{log.user.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground break-all">{log.user.email}</div>
                              <div className="mt-1">{getRoleBadge(log.user.role)}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">System / Guest</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{getActionLabel(log.action)}</TableCell>
                        <TableCell className="text-sm max-w-md">
                          {log.description || <span className="text-xs text-muted-foreground">No description</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {getDeviceBrowserLabel(log.user_agent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-8 w-8 mb-2" />
                <p>No activity logs found for the selected filters.</p>
              </div>
            )}

            {/* Pagination */}
            {logs.links && logs.links.length > 0 && (
              <div className="mt-4 flex justify-center">
                <nav className="flex items-center gap-2" aria-label="Pagination">
                  {logs.links.map((link, index) => {
                    const label = link.label
                      .replace('&laquo;', '«')
                      .replace('&raquo;', '»');

                    if (link.url === null) {
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 rounded border text-xs text-gray-400 border-gray-200"
                        >
                          {label}
                        </span>
                      );
                    }

                    return (
                      <Link
                        key={index}
                        href={link.url}
                        className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                          link.active
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

ActivityLogsIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ActivityLogsIndex;
