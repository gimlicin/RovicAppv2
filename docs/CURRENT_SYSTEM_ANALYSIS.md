# Current System Analysis - RovicApp

**Analysis Date**: November 26, 2025  
**Purpose**: Understand current architecture before implementing panel revisions

---

## 🎯 Current Role System

### **Existing Roles** (in User Model & Database)
Located: `app/Models/User.php`

```php
const ROLE_CUSTOMER = 'customer';
const ROLE_WHOLESALER = 'wholesaler';
const ROLE_ADMIN = 'admin';
```

**Database**: `role` column is ENUM type with values: `['customer', 'wholesaler', 'admin']`
- Migration: `database/migrations/2025_08_25_055015_add_role_fields_to_users_table.php`
- Default: `customer`

### **Role Helper Methods**
- `isCustomer()` - checks if user is customer
- `isWholesaler()` - checks if user is wholesaler
- `isAdmin()` - checks if user is admin

### **Current Middleware**
**AdminMiddleware** (`app/Http/Middleware/AdminMiddleware.php`):
- Checks if user is authenticated
- Checks if user `isAdmin()`
- Used for all `/admin/*` routes

---

## 📊 Analytics Dashboard - Current Location

### **File**: `resources/js/pages/Admin/Dashboard.tsx`
### **Controller**: `app/Http/Controllers/Admin/AdminDashboardController.php`
### **Route**: `/admin/dashboard` (protected by `admin` middleware)

### **Analytics Displayed**:

#### **Primary Stats Cards** (Lines 88-143):
1. **Total Orders** - `stats.total_orders`
   - Links to: `/admin/orders`
   
2. **Pending Orders** - `stats.pending_orders`
   - Orders with status='pending'
   
3. **Pending Payments** - `stats.pending_payments`
   - Orders with payment_status='submitted'
   
4. **Total Revenue** - `stats.total_revenue`
   - Sum of all approved payments

#### **Secondary Stats Cards** (Lines 145-202):
5. **Total Products** - `stats.total_products`
   - Links to: `/admin/products`
   
6. **Total Users** - `stats.total_users`
   - Count of non-admin users
   
7. **Total Categories** - `stats.total_categories`
   - Links to: `/admin/categories`
   
8. **Inventory Value** - `stats.total_inventory_value`
   - Calculated: price × stock_quantity for all products

#### **Data Lists** (Lines 204-317):
9. **Recent Orders** (last 5 orders)
   - Order ID, customer, items, total, status, date
   
10. **Recent Products** (last 5 products)
    - Product name, category, price, stock, status badges

### **Backend Stats Calculation** (AdminDashboardController.php):
```php
$stats = [
    'total_products' => Product::count(),
    'total_users' => User::where('role', '!=', 'admin')->count(),
    'total_categories' => Category::count(),
    'total_inventory_value' => Product::sum(DB::raw('price * stock_quantity')),
    'total_orders' => Order::count(),
    'pending_orders' => Order::where('status', 'pending')->count(),
    'pending_payments' => Order::where('payment_status', 'submitted')->count(),
    'total_revenue' => Order::where('payment_status', 'approved')->sum('total_amount'),
];
```

---

## 🗂️ Admin Routes Structure

**Protected by**: `['auth', 'verified', 'admin']` middleware  
**Prefix**: `/admin`  
**Name Prefix**: `admin.`

### **Current Admin Functions**:
1. **Dashboard** - `/admin/dashboard`
2. **Order Management** - `/admin/orders/*`
   - View, update status, manage payments
   - Generate invoice
3. **Product Management** - `/admin/products/*`
   - CRUD operations
   - Toggle best-selling
   - Toggle active/inactive
   - Stock adjustments
   - Low stock view
4. **Category Management** - `/admin/categories/*`
   - CRUD operations
   - Toggle active/inactive
5. **Payment Settings** - `/admin/payment-settings/*`
   - Manage payment methods (GCash, Maya, etc.)
   - QR code management

---

## 📁 Admin Page Structure

```
resources/js/pages/Admin/
├── Dashboard.tsx         ← ANALYTICS HERE (needs to move to Super Admin)
├── Orders/
│   └── Index.tsx        ← Order management (stays in Admin)
├── Products/            ← Product management (stays in Admin)
│   ├── Index.tsx
│   ├── Create.tsx
│   ├── Edit.tsx
│   ├── LowStock.tsx
│   └── Show.tsx
├── Categories/          ← Keep for both Admin & Super Admin?
│   └── ...
└── Settings/           
    └── ...
```

---

## 🔄 Required Changes for Role Restructure

### **1. Database Changes**
- Add `super_admin` to role ENUM
- Create migration to update role column

### **2. User Model Updates**
- Add `ROLE_SUPER_ADMIN = 'super_admin'`
- Add `isSuperAdmin()` method
- Update scopes

### **3. Middleware Changes**
- Create `SuperAdminMiddleware` for super admin only routes
- Keep `AdminMiddleware` for shared admin features
- Or create `RoleMiddleware` with parameter support

### **4. Route Restructuring**
**Super Admin Only** (new `/super-admin` prefix):
- Dashboard with analytics (move from `/admin/dashboard`)
- User Management (new feature)
- Reports (new PDF export feature)
- Activity Logs (new feature)

**Admin** (keep `/admin` prefix):
- Orders management
- Products management
- Categories management (maybe?)

**Shared**:
- Payment Settings (both can access?)
- Product/Category management?

### **5. Frontend Changes**
- Create new `resources/js/pages/SuperAdmin/` folder
- Move `Dashboard.tsx` → `SuperAdmin/Dashboard.tsx`
- Create new simple `Admin/Dashboard.tsx` for Admin role (orders + products overview only)
- Create `SuperAdmin/UserManagement/` pages
- Update navigation menus based on role

---

## 📋 Navigation/Menu System

**Need to find**: Where is the admin navigation menu defined?
- Check: `resources/js/layouts/app-layout.tsx` or similar
- Need to split menus based on role (Super Admin vs Admin)

---

## 🎯 Implementation Strategy

### **Phase 1**: Role System Foundation
1. Create migration to add `super_admin` to role enum
2. Update User model with super admin constants and methods
3. Create SuperAdminMiddleware or update AdminMiddleware
4. Seed database with initial super admin user

### **Phase 2**: Route & Permission Separation
1. Create `/super-admin` route group with super admin middleware
2. Move analytics dashboard route to super admin
3. Keep order/product routes in `/admin` for both roles
4. Add role checks where needed

### **Phase 3**: Frontend Restructuring
1. Create `SuperAdmin/` folder structure
2. Move Dashboard.tsx to SuperAdmin
3. Create simple new Dashboard for Admin (orders + products only)
4. Update navigation to show different menus per role
5. Add permission checks in components

### **Phase 4**: New Features
1. User Management UI for Super Admin
2. Activity Logs system
3. PDF Reports with filtering

---

## ✅ FINAL ROLE STRUCTURE DECISIONS

### **Super Admin** (Full Access)
- ✅ Analytics Dashboard (moved from admin)
- ✅ User Management (can create Admin & Customer, NOT other Super Admins)
- ✅ Categories Management (moved from admin)
- ✅ Payment Settings (moved from admin)
- ✅ Reports with PDF export
- ✅ Activity Logs
- ✅ View Orders & Products (read-only or full access TBD)

### **Admin** (Limited Access)
- ✅ Orders Management ONLY
- ✅ Products Management ONLY
- ❌ NO Analytics/Dashboard
- ❌ NO User Management
- ❌ NO Categories
- ❌ NO Payment Settings

### **Customer**
- Shopping features
- View own orders
- Checkout
- **Note**: `wholesaler` role exists in database but is NOT actively used - bulk buyers are just regular customers

### **Migration Strategy**
- Existing `admin` role users: **KEEP as admin** (not upgraded to super_admin)
- Super Admin users must be created manually
- This means existing admins will have LIMITED access after update

---

## 🗂️ Route Structure - NEW DESIGN

### **/super-admin** Routes (Super Admin Only)
```
/super-admin/dashboard          → Analytics
/super-admin/users              → User Management
/super-admin/categories         → Categories (moved)
/super-admin/payment-settings   → Payment Settings (moved)
/super-admin/reports            → PDF Reports
/super-admin/activity-logs      → Activity Logs
```

### **/admin** Routes (Admin Only)
```
/admin/orders                   → Order Management
/admin/products                 → Product Management
```

### Migration Impact:
- Current `/admin/dashboard` → Redirect to `/super-admin/dashboard` for super admins
- Current `/admin/dashboard` → Redirect to `/admin/orders` for admins (or create simple dashboard)
- `/admin/categories` → Move to `/super-admin/categories`
- `/admin/payment-settings` → Move to `/super-admin/payment-settings`

---

**Summary**: Clear separation - Super Admin has full system control, Admin is restricted to day-to-day operations (orders + products only).
