import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Package, FolderOpen, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  products_count: number;
  created_at: string;
}

interface Stats {
  total_categories: number;
  active_categories: number;
  total_products: number;
}

interface PaginationData {
  data: Category[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Props {
  categories: PaginationData;
  stats: Stats;
}

function CategoriesIndex({ categories, stats }: Props) {
  const toggleActive = (categoryId: number) => {
    router.patch(`/super-admin/categories/${categoryId}/toggle-active`, {}, {
      preserveScroll: true,
    });
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      router.delete(`/super-admin/categories/${categoryId}`);
    }
  };

  return (
    <>
      <Head title="Categories - Admin" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
          <Button asChild>
            <Link href="/super-admin/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_categories}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
              <ToggleRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_categories}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_products}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>A list of all categories in your store</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.data.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{category.products_count} products</TableCell>
                    <TableCell>
                      {category.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(category.id)}
                        >
                          {category.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/super-admin/categories/${category.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(category.id, category.name)}
                          disabled={category.products_count > 0}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {categories.data.length} of {categories.total} categories
              </div>
              <div>
                Page {categories.current_page} of {categories.last_page}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

CategoriesIndex.layout = (page: React.ReactElement) => <AppLayout>{page}</AppLayout>;

export default CategoriesIndex;
