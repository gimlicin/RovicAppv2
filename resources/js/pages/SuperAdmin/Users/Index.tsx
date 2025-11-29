import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Users as UsersIcon, Plus, Edit, Trash2, Search, Filter, Mail, MailCheck, MailX } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at: string | null;
    created_at: string;
    phone: string | null;
    address: string | null;
}

interface PaginationData {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Stats {
    total_users: number;
    total_customers: number;
    total_admins: number;
    verified_users: number;
}

interface Props {
    users: PaginationData;
    stats: Stats;
    filters: {
        search?: string;
        role?: string;
        verified?: string;
    };
}

function UsersIndex({ users, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || 'all');
    const [verified, setVerified] = useState(filters.verified || 'all');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/users', { search, role, verified }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (filterType: string, value: string) => {
        const params = { search, role, verified };
        if (filterType === 'role') {
            params.role = value;
            setRole(value);
        } else if (filterType === 'verified') {
            params.verified = value;
            setVerified(value);
        }
        
        router.get('/super-admin/users', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const deleteUser = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteUser = () => {
        if (!userToDelete || isDeleting) return;

        setIsDeleting(true);
        router.delete(`/super-admin/users/${userToDelete.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
            },
        });
    };

    const toggleVerification = (userId: number) => {
        router.patch(`/super-admin/users/${userId}/toggle-verification`, {}, {
            preserveScroll: true,
        });
    };

    const getRoleBadge = (userRole: string) => {
        switch (userRole) {
            case 'super_admin':
                return <Badge variant="default" className="bg-purple-600">Super Admin</Badge>;
            case 'admin':
                return <Badge variant="default" className="bg-blue-600">Admin</Badge>;
            case 'customer':
                return <Badge variant="secondary">Customer</Badge>;
            default:
                return <Badge variant="outline">{userRole}</Badge>;
        }
    };

    return (
        <>
            <Head title="User Management - Super Admin" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage system users and permissions</p>
                    </div>
                    <Button asChild>
                        <Link href="/super-admin/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Customers</CardTitle>
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_customers}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admins</CardTitle>
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_admins}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                            <MailCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.verified_users}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <Select value={role} onValueChange={(value) => handleFilter('role', value)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={verified} onValueChange={(value) => handleFilter('verified', value)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Verification status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" variant="default">
                                <Filter className="mr-2 h-4 w-4" />
                                Apply
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users ({users.total})</CardTitle>
                        <CardDescription>List of all system users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Email Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell>
                                                    {user.email_verified_at ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <MailCheck className="mr-1 h-3 w-3" />
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <MailX className="mr-1 h-3 w-3" />
                                                            Unverified
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {user.role !== 'super_admin' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleVerification(user.id)}
                                                                    title={user.email_verified_at ? 'Remove verification' : 'Mark as verified'}
                                                                >
                                                                    <Mail className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link href={`/super-admin/users/${user.id}/edit`}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteUser(user)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <UsersIcon className="mx-auto h-8 w-8 mb-2" />
                                <p>No users found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete User Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) {
                            setUserToDelete(null);
                            setIsDeleting(false);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to permanently delete{' '}
                                <span className="font-semibold text-foreground">
                                    {userToDelete?.name ? `"${userToDelete.name}"` : 'this user'}
                                </span>
                                ? This will remove their access to the system. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDeleteDialogOpen(false);
                                        setUserToDelete(null);
                                        setIsDeleting(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDeleteUser}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete User'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

UsersIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />;

export default UsersIndex;
