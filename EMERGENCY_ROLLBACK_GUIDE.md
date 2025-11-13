# 🚨 EMERGENCY ROLLBACK GUIDE

## ⚡ QUICK ROLLBACK (If Something Breaks)

### Method 1: Rollback to Stable Tag (FASTEST)
```bash
# Reset to stable version
git reset --hard v1.0-capstone-stable

# Force push to production (deploy to Render)
git push origin main --force
```

### Method 2: Rollback to Backup Branch
```bash
# Switch to backup branch
git checkout capstone-demo-backup

# Make it your main branch
git checkout -b main-temp
git branch -D main
git branch -m main
git push origin main --force
```

### Method 3: Rollback Last Commit Only
```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Or undo last commit and discard changes
git reset --hard HEAD~1

# Push to production
git push origin main --force
```

## 📌 STABLE VERSION DETAILS

**Tag:** `v1.0-capstone-stable`
**Branch Backup:** `capstone-demo-backup`
**Commit Hash:** `b3181b6`

**What's Working:**
- ✅ Real cart totals (no more ₱100)
- ✅ Order items with actual products
- ✅ Cart clearing after order
- ✅ Professional UI with visual feedback
- ✅ Complete order confirmation
- ✅ Admin order management
- ✅ Stable production deployment

**Features Working:**
- Customer can browse products
- Customer can add to cart with real prices
- Customer can checkout with all required fields
- Order confirmation shows real totals
- Admin can view all orders
- Admin can see order items and details
- Admin can update order status

## 🔍 HOW TO CHECK CURRENT VERSION

```bash
# See current commit
git log --oneline -1

# See all tags
git tag -l

# See all branches
git branch -a
```

## ⚠️ IMPORTANT NOTES

1. **Always test locally first** before deploying to production
2. **The stable version is fully tested** and working perfectly
3. **Render auto-deploys from main branch** - any push to main goes live
4. **Keep this file open during your demo** for quick reference

## 🎯 DEMO DAY STRATEGY

**Option A: Use Stable Version (RECOMMENDED)**
- Zero risk of issues
- All core features working
- Can explain future enhancements

**Option B: Try New Features**
- Test extensively before demo
- Have rollback plan ready
- Know how to quickly revert if needed

## 📞 QUICK ROLLBACK DURING DEMO

If something breaks during demo:
1. Stay calm - this shows problem-solving skills
2. Open terminal
3. Run: `git reset --hard v1.0-capstone-stable`
4. Run: `git push origin main --force`
5. Wait 2 minutes for Render to redeploy
6. Explain: "This demonstrates our version control and rollback strategy"

**Turn a bug into a feature!** Showing you can recover quickly is impressive!

---

**Created:** November 14, 2025
**Purpose:** Capstone Demo Safety Net
**Status:** STABLE VERSION BACKED UP ✅
