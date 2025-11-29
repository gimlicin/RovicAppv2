# Capstone Project - Post-Defense Revision Plan

**Date**: November 26, 2025  
**Status**: Defense Successful ✅ | Revisions Required  
**Timeline**: 5 days to complete revisions  
**Approach**: Implement locally first, then deploy to production

---

## 📋 Context

Successfully defended capstone project. Panel provided minimal but important revisions that need to be completed within 5 days. A version control checkpoint (`pre-revision-checkpoint` tag) was created before starting revisions.

---

## 🎯 Required Revisions from Panel

### 1. **Reports System Enhancement** 📊
**Requirements:**
- Must be **tamperproof/read-only PDF format** only (no Excel exports)
- Include metadata: date/time and "printed by" information
- Add filtering options:
  - Daily
  - Weekly  
  - Monthly
  - Yearly
- Show detailed history per client
- **NEW**: Include **charts/visualizations** in PDF reports (order trends, revenue graphs, etc.)

**Current State**: Only **Order List** report exists - needs PDF export implementation
**Scope**: Convert order list to PDF with date/time filtering capability + add visual charts

---

### 2. **Order Management Enhancement** 📦

**A. Status Tabs (Better UX):**
- Replace filter dropdown with **horizontal status tabs**
- Tabs: All | Pending | Approved | Preparing | Ready | Completed | Rejected
- Show count badge on each tab (e.g., "Pending (12)")
- One-click navigation between order statuses
- Industry standard pattern (Shopee/Lazada Seller style)

**B. Next Action Dropdown:**
Add "Next Action" dropdown for order status workflow with the following states:
1. Pending
2. Approve/Reject
3. Preparing
4. Mark as Ready
5. Complete Order
6. **Receipt Issuance** - Generates and exports invoice/receipt PDF automatically

**C. Invoice Integration:**
- **Remove** separate "Export Invoice" button
- Invoice generation integrated into "Receipt Issuance" action
- When admin selects Receipt Issuance → Order completed + Invoice PDF generated/downloaded

**Purpose**: Better order tracking, workflow management, and cleaner UI

---

### 3. **User Role & Permission System** 👥
**Requirements:**
Implement three-tier user level system with permission restructuring:

- **Super Admin**
  - Full system access
  - User management capabilities
  - **Analytics/Dashboard** (moved from Admin)
  - Order management
  - Product management
  - Reports access
  
- **Admin**
  - **Order Management ONLY**
  - **Product Management ONLY**
  - NO access to analytics
  - NO user management
  
- **User (Customer)**
  - Shopping features
  - View own orders
  - Basic customer functions

**Key Change**: Move analytics from Admin role to Super Admin only
**Current State**: Need to verify existing role system and restructure permissions

---

### 4. **Product List Filtering** 🔍
**Requirements:**
Add stock status filters on product list:
- **On Stock** - Products available
- **Low Stock** - Products running low

**Location**: Product list/inventory pages

---

### 5. **Bug Fix - Payment Photo Upload** 🐛
**Issue**: Bug when uploading payment confirmation photo  
**Status**: Need details on exact bug behavior

---

### 6. **Product Images Update** 🖼️
**Requirements:**
- Remove stock/placeholder images
- Replace with real product photos from actual store

**Status**: Need confirmation if real photos are ready

---

### 7. **Activity Logs System** 📝
**Requirements:**
Track and log user actions throughout the system (suggested by Dean)

**Implementation Needed:**
- User action tracking
- Timestamp logging
- Activity history view
- Filterable logs

---

### 8. **User Management Interface** ⚙️
**Requirements:**
Add user management UI for Super Admin role:
- View all users
- Create/edit/delete users
- Assign roles
- Manage permissions

---

### 9. **Dashboard Clock Display** 🕐
**Requirements:**
- Add live clock display on **upper left** of dashboard
- Should show on both:
  - Super Admin Dashboard
  - Admin Dashboard
- Display current date and time
- Update in real-time

**Purpose**: Professional UI enhancement, helps with time-based operations

---

### 10. **Payment Method Enhancement** 💵
**Requirements:**
- Add **Cash** as payment method option in Payment Settings
- Cash payment workflow:
  - Customer selects "Cash" at checkout
  - Order marked as "Cash on Delivery" or "Cash on Pickup"
  - No payment proof upload needed for cash orders
  - Payment marked complete upon delivery/pickup

**Location**: Super Admin → Payment Settings

---

### 11. **Payment Reference Number Field** 🔢
**Requirements:**
- Add **Reference Number** input field when uploading payment proof
- Field should be:
  - Optional text input
  - Displayed in order details
  - Visible to admin when reviewing payment proof
- Supports all payment methods (GCash, Maya, Bank Transfer, etc.)

**Implementation**: 
- Add `payment_reference` column to orders table
- Update payment upload form with reference number field
- Display reference in order management

**Why not PayMongo API**: Manual input works for all payment types, simpler implementation, no API fees

---

### 12. **Email Verification & Registration Validation** ✉️
**Requirements:**
Panel requested "validation" for registration and login.

**Recommended Implementation:**
- **Registration**: Email verification required
  - User registers → Receives verification email → Clicks link → Account activated
  - Cannot login until email is verified
  - Prevents fake/bot registrations
  
- **Login**: Standard authentication
  - Email + Password (no OTP every login)
  - Rate limiting (5 failed attempts = temporary block)
  - Strong password requirements (min 8 chars, letters + numbers)

- **Password Security**:
  - Password strength validation on registration
  - Forgot password via email reset link

**Why Email Verification (not OTP every login)**:
- ✅ Industry standard for e-commerce (Shopee, Lazada pattern)
- ✅ Good balance of security vs user experience
- ✅ Prevents fake accounts
- ✅ Quick implementation (Laravel built-in support)
- ✅ No user friction (one-time verification)
- ❌ OTP every login = poor UX, higher cart abandonment

**For All Roles**: Customer, Admin, Super Admin all require email verification

---

## 🔄 Rollback Information

**Checkpoint Tag**: `pre-revision-checkpoint`  
**Commit**: `f161bab` - "Checkpoint: Pre-revision state after successful capstone defense"

**To rollback if needed:**
```bash
git checkout pre-revision-checkpoint
# or
git reset --hard pre-revision-checkpoint
```

---

## 📁 Project Organization

Recently organized documentation:
- `docs/sessions/` - Session summaries and demo scripts
- `docs/features/` - Feature implementation docs
- `docs/deployment/` - Deployment guides and fixes
- `docs/guides/` - Setup and how-to guides
- `docs/archive/` - Completed/historical docs

---

## ❓ Questions to Address Before Implementation

1. ~~**Reports**: Which reports currently exist that need PDF conversion?~~ ✅ **ANSWERED**: Only Order List report
2. ~~**Product Photos**: Are real store product photos ready for upload?~~ ✅ **ANSWERED**: Yes, but low priority
3. ~~**Payment Bug**: What exactly is the payment photo upload bug?~~ ✅ **SKIP**: Not focusing on this now
4. ~~**Current Roles**: What role/permission system currently exists?~~ ✅ **ANALYZED**: See `CURRENT_SYSTEM_ANALYSIS.md`
5. **Order States**: What is the current order status implementation?
6. ~~**Analytics Location**: Where are analytics currently displayed in the admin panel?~~ ✅ **FOUND**: `/admin/dashboard` with 10 analytics components

### ✅ All Questions Answered:
7. ~~**Categories Management**: Super Admin only, Admin only, or both?~~ ✅ **Super Admin ONLY**
8. ~~**Payment Settings**: Super Admin only, Admin only, or both?~~ ✅ **Super Admin ONLY**
9. ~~**User Management**: Can Super Admin create other Super Admins?~~ ✅ **NO, only Admin & Customer**
10. ~~**Existing Admins**: Migrate to super_admin or keep as limited admin?~~ ✅ **KEEP as admin (limited access)**

## 📋 FINAL ROLE PERMISSIONS

### **Super Admin**
- Analytics/Dashboard ✅
- User Management (create Admin/Customer only) ✅
- Categories Management ✅
- Payment Settings ✅
- Reports (PDF export) ✅
- Activity Logs ✅
- Orders & Products (view access) ✅

### **Admin**
- Orders Management ✅
- Products Management ✅
- Everything else: ❌

### **Customer**
- Shopping & view own orders ✅
- (Note: Bulk buyers are also customers, no separate wholesaler role)

---

## 🎯 Recommended Implementation Order

### **Phase 1 - Role System Foundation & Email Verification** (Day 1)
**Backend:**
- Create migration to add `super_admin` to role ENUM
- Update `User` model: add `ROLE_SUPER_ADMIN` constant and `isSuperAdmin()` method
- Create `SuperAdminMiddleware` middleware
- Seed database with initial super_admin user
- **Enable Laravel email verification**: Implement `MustVerifyEmail` interface
- Update registration to send verification email
- Add email verification routes and views
- Add password strength validation rules

**Frontend:**
- Create `resources/js/pages/SuperAdmin/` folder structure
- Update registration form with password strength indicator
- Add email verification notice page
- Update login to check email verification status

### **Phase 2 - Route & Permission Restructure** (Day 1-2)
**Move to Super Admin:**
- Create `/super-admin` route group with super admin middleware
- Move `/admin/dashboard` → `/super-admin/dashboard`
- Move `/admin/categories` → `/super-admin/categories`
- Move `/admin/payment-settings` → `/super-admin/payment-settings`

**Keep in Admin:**
- `/admin/orders` - accessible by both super admin & admin
- `/admin/products` - accessible by both super admin & admin

**Redirects:**
- Update `/dashboard` logic to redirect based on role
- Super Admin → `/super-admin/dashboard`
- Admin → `/admin/orders` (or simple dashboard)
- Customer → `/home`

### **Phase 3 - Frontend Components Migration** (Day 2)
- Move `Admin/Dashboard.tsx` → `SuperAdmin/Dashboard.tsx`
- Move `Admin/Categories/` → `SuperAdmin/Categories/`
- Move `Admin/Settings/` → `SuperAdmin/Settings/`
- Create simple `Admin/Dashboard.tsx` (orders + products shortcuts only)
- **Add live clock component** on upper left of both dashboards (show date/time, update every second)
- Update navigation menus based on role (show different menu items)

### **Phase 4 - User Management UI** (Day 2-3)
- Create `SuperAdmin/Users/Index.tsx` - list all users
- Create `SuperAdmin/Users/Create.tsx` - create Admin/Customer (NOT super admin)
- Create `SuperAdmin/Users/Edit.tsx` - edit user details
- Backend: User CRUD controller for super admin
- Add role assignment in forms (Admin or Customer only, no super_admin option)

### **Phase 5 - Order & Payment Enhancement** (Day 3)
**Order UI Improvements:**
- **Replace status filter with horizontal tabs** (All, Pending, Approved, Preparing, Ready, Completed, Rejected)
- Add count badges to tabs showing number of orders per status
- Tab-based filtering for better UX (Shopee/Lazada Seller pattern)
- Update Orders/Index.tsx component with tab navigation

**Order Workflow:**
- Add "Next Action" dropdown in order management
- Implement workflow states:
  1. Pending
  2. Approve/Reject
  3. Preparing
  4. Mark as Ready
  5. Complete Order
  6. Receipt Issuance (triggers invoice PDF generation)
- Update order status logic
- **Remove separate "Export Invoice" button**
- Integrate invoice generation into Receipt Issuance action (auto-generate/download PDF)

**Payment Reference:**
- Add `payment_reference` column to orders table (migration)
- Add reference number input field in payment upload form (optional)
- Display reference number in order details and admin order view
- Update OrderController to save reference number

### **Phase 6 - Product Filtering & Payment Settings** (Day 3)
**Product Filtering:**
- Add stock status filters on product list
- "On Stock" filter (stock_quantity > 0)
- "Low Stock" filter (stock_quantity <= 5 or custom threshold)

**Cash Payment Method:**
- Add "Cash" option to Payment Settings (Super Admin)
- Update checkout to support cash payment selection
- Handle cash orders workflow (no payment proof needed)
- Mark payment as complete upon delivery/pickup confirmation

### **Phase 7 - PDF Reports System with Charts** (Day 4)
- Install PDF library (dompdf or similar) and charting library (e.g., Chart.js for image generation)
- Create Order List PDF template
- **Add visual charts**: Order trends, revenue graphs, category breakdown, etc.
- Generate chart images and embed in PDF
- Add date/time filtering (Daily/Weekly/Monthly/Yearly)
- Include metadata: date/time, "printed by" user
- Make PDFs tamperproof/read-only
- Show detailed history per client

### **Phase 8 - Activity Logs** (Day 4-5)
- Create `activity_logs` database table
- Implement logging middleware/trait
- Track user actions: create, update, delete operations
- Create `SuperAdmin/ActivityLogs/Index.tsx`
- Add filtering by user, action type, date range

### **Phase 9 - Product Images** (Day 5)
- Replace placeholder images with real store photos
- Update product records with new image URLs

### **Phase 10 - Testing & Deployment** (Day 5)
- Test all role permissions
- Test navigation and redirects
- Test new features (user management, reports, activity logs)
- Fix any bugs
- Commit all changes
- Deploy to production

---

## 💡 Implementation Notes

- Work on local environment first
- Test thoroughly before deploying
- Commit changes incrementally
- Use feature branches if needed
- Deploy only when all features are tested and working

---

## 🚀 Next Steps

1. Answer clarifying questions about current state
2. Review existing codebase for reports, roles, and order management
3. Create detailed implementation plan
4. Begin Phase 1 implementation

---

**Use this document as context for future sessions to continue revision work.**
