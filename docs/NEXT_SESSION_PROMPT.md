# Context Prompt for Next Session

Copy and paste this to provide context:

---

**CONTEXT**: We successfully defended our capstone project (RovicApp - E-commerce system) and received revision requests from the panel. We have **5 days** to complete revisions. A checkpoint was created at tag `pre-revision-checkpoint` before starting work.

**PANEL REVISIONS REQUIRED**:

1. **Reports System**: Export **Order List report** as tamperproof PDF (not Excel) with date/time, "printed by" info, and filtering (Daily/Weekly/Monthly/Yearly). Show client history details.

2. **Order Management Enhancement**: 
   - Replace status filters with horizontal **tabs** (All | Pending | Approved | Preparing | Ready | Completed | Rejected) with count badges
   - Add "Next Action" dropdown workflow: Pending → Approve/Reject → Preparing → Mark as Ready → Complete Order → Receipt Issuance
   - Remove separate "Export Invoice" button, integrate invoice generation into Receipt Issuance action (auto-generates PDF)

3. **User Roles & Permission Restructure**: Implement 3 levels with clear separation:
   - **Super Admin**: Analytics/Dashboard, User Management (create Admin/Customer only, NOT super admin), Categories, Payment Settings, Reports, Activity Logs
   - **Admin**: Orders + Products Management ONLY (everything else removed)
   - **Customer**: Shopping and view own orders (Note: wholesaler role exists in DB but unused, bulk buyers are customers)
   - **Decision**: Existing admin users KEEP as admin (limited access), super admin created manually

4. **Product Filtering**: Add "On Stock" and "Low Stock" filters on product list.

5. **Bug Fix**: Fix payment photo upload issue.

6. **Product Images**: Replace placeholder images with real store photos.

7. **Activity Logs**: Track and display user actions (suggested by Dean).

8. **User Management UI**: Create interface for Super Admin to manage users.

9. **Dashboard Clock**: Add live clock display on upper left of both Admin and Super Admin dashboards.

10. **Cash Payment Method**: Add Cash as payment option in Payment Settings (Super Admin side).

11. **Payment Reference Number**: Add optional reference number input field when uploading payment proof (works for all payment methods).

12. **Email Verification**: Implement email verification for all user registrations (Customer, Admin, Super Admin). Users must verify email before accessing the system. No OTP on every login - just standard email/password with rate limiting.

**REPORTS ENHANCEMENT**: PDF reports should include visual charts (order trends, revenue graphs, etc.), not just tables.

**ROUTE RESTRUCTURE**:
- **Super Admin routes**: `/super-admin/*` (Dashboard, Users, Categories, Payment Settings, Reports, Activity Logs)
- **Admin routes**: `/admin/*` (Orders, Products only)
- **Migrations**: Dashboard, Categories, Payment Settings move from `/admin` to `/super-admin`

**CURRENT STATUS**: 
- Working on local environment first
- Documentation organized into docs/ folder structure
- All questions answered, ready to begin implementation
- System analyzed: Current role system uses `customer`, `wholesaler`, `admin` - need to add `super_admin`

**IMPLEMENTATION PLAN**:
Phase 1: Role system foundation + Email verification (migration, User model, middleware, email verification)
Phase 2-3: Route restructure & frontend migration (move to /super-admin, add clock component)
Phase 4: User Management UI
Phase 5-6: Order enhancement (workflow, payment reference) & product filtering + cash payment
Phase 7-8: PDF reports with charts & activity logs
Phase 9-10: Product images & deployment

**TOTAL REVISIONS**: 12 major features to implement

**APPROACH**: Implement locally → Test thoroughly → Commit → Deploy to production

Refer to `/docs/CAPSTONE_REVISION_PLAN.md` for full details and `/docs/CURRENT_SYSTEM_ANALYSIS.md` for technical analysis.
