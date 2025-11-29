# 🚀 Render Deployment Checklist

## ⚠️ **CRITICAL: Check These Environment Variables on Render**

### **How to Access:**
1. Go to https://dashboard.render.com
2. Select your web service
3. Click "Environment" tab
4. Verify/Add these variables:

---

## 📋 **Required Environment Variables**

### **1. Application Settings (CRITICAL)**
```env
APP_NAME=Rovic Meat Products
APP_ENV=production
APP_KEY=base64:YOUR_32_CHARACTER_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app-name.onrender.com
```

**⚠️ If APP_KEY is missing:**
```bash
# Generate locally then copy to Render
php artisan key:generate --show
```

---

### **2. Database Settings (Auto-provided by Render)**
These should already be set if you connected a PostgreSQL database:
```env
DB_CONNECTION=pgsql
DB_HOST=dpg-xxxxx.oregon-postgres.render.com
DB_PORT=5432
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_generated_password
```

**✅ Usually auto-configured by Render**

---

### **3. Session Settings (CRITICAL FOR CART)**
```env
SESSION_DRIVER=database
SESSION_LIFETIME=480
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
```

**⚠️ If missing, cart won't work!**

---

### **4. File Storage (CRITICAL FOR PAYMENT PROOFS)**
```env
FILESYSTEM_DISK=public
```

**⚠️ If missing, payment proof uploads will fail!**

---

### **5. Cache Settings (RECOMMENDED)**
```env
CACHE_STORE=database
```

---

### **6. Queue Settings (RECOMMENDED)**
```env
QUEUE_CONNECTION=database
```

---

### **7. Logging (RECOMMENDED)**
```env
LOG_CHANNEL=stack
LOG_LEVEL=error
```

---

### **8. Mail Settings (OPTIONAL - Can use 'log' for demo)**
```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@rovicmeat.com
MAIL_FROM_NAME=Rovic Meat Products
```

---

## 🔍 **Missing Variables Symptoms**

### **If APP_KEY is missing:**
- ❌ Application won't start
- ❌ "No application encryption key" error

### **If SESSION_DRIVER is missing/wrong:**
- ❌ Cart items disappear
- ❌ Login doesn't persist
- ❌ 419 CSRF errors

### **If FILESYSTEM_DISK is missing:**
- ❌ Payment proof upload fails
- ❌ 500 error on file upload

### **If DB credentials are wrong:**
- ❌ "Connection refused" errors
- ❌ Can't access any page
- ❌ Migrations fail

---

## ✅ **Post-Deployment Commands**

After environment variables are set, run these in Render Shell:

### **1. Run Migrations**
```bash
php artisan migrate --force
```

### **2. Link Storage (For Payment Proofs)**
```bash
php artisan storage:link
```

### **3. Clear Config Cache**
```bash
php artisan config:clear
php artisan cache:clear
```

### **4. Seed Products (Optional)**
```bash
php artisan db:seed --class=ProductSeeder
```

---

## 🧪 **Test After Deployment**

### **Test 1: Basic Access**
- [ ] Visit your Render URL
- [ ] Homepage loads
- [ ] Can see products
- [ ] No errors in browser console

### **Test 2: Cart Functionality**
- [ ] Add product to cart
- [ ] Cart count updates
- [ ] Refresh page - cart persists
- [ ] Can update quantities

### **Test 3: Order Submission (Cash)**
- [ ] Complete checkout form
- [ ] Select "Cash on Delivery"
- [ ] Submit order
- [ ] See order confirmation

### **Test 4: Payment Proof Upload**
- [ ] Complete checkout form
- [ ] Select QR payment method
- [ ] Upload image
- [ ] Submit order (should succeed)

### **Test 5: Admin Panel**
- [ ] Login as admin
- [ ] View orders list
- [ ] Open order detail
- [ ] See payment proof (if uploaded)
- [ ] Approve/reject payment

---

## 🚨 **Common Issues & Fixes**

### **Issue: "SQLSTATE[08006] Connection refused"**
**Cause:** Database credentials wrong or DB not running
**Fix:**
1. Check DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
2. Verify PostgreSQL instance is running on Render
3. Make sure DB and web service are in same region

### **Issue: "419 Page Expired" on form submit**
**Cause:** Session not working properly
**Fix:**
1. Set SESSION_DRIVER=database
2. Run `php artisan migrate` (creates sessions table)
3. Clear cache: `php artisan config:clear`

### **Issue: "No application encryption key"**
**Cause:** APP_KEY not set
**Fix:**
1. Generate key locally: `php artisan key:generate --show`
2. Copy the base64:xxx value to Render
3. Restart service

### **Issue: Payment proof upload fails**
**Cause:** Storage not linked or FILESYSTEM_DISK wrong
**Fix:**
1. Set FILESYSTEM_DISK=public
2. Run `php artisan storage:link`
3. Check storage/app/public folder exists

### **Issue: Cart disappears on refresh**
**Cause:** Session driver not set to database
**Fix:**
1. Set SESSION_DRIVER=database
2. Run migrations (creates sessions table)
3. Clear browser cookies and try again

---

## 📱 **Quick Health Check Command**

Run this in Render Shell to check everything:
```bash
# Check database connection
php artisan tinker --execute="DB::connection()->getPdo(); echo 'DB Connected!';"

# Check storage
ls -la storage/app/public

# Check sessions table
php artisan tinker --execute="echo 'Sessions: ' . DB::table('sessions')->count();"

# Check orders
php artisan tinker --execute="echo 'Orders: ' . App\Models\Order::count();"
```

---

## 🎯 **Minimum Variables for Demo to Work**

If you're short on time, **these are ABSOLUTELY REQUIRED:**

```env
APP_KEY=base64:xxxxx                    # Critical - App won't start
APP_URL=https://your-app.onrender.com   # Important - Links work correctly
APP_ENV=production                       # Important - Production mode
APP_DEBUG=false                          # Important - Hide errors from users

DB_CONNECTION=pgsql                      # Critical - Database
DB_HOST=your-db.render.com              # Critical - Database
DB_PORT=5432                            # Critical - Database
DB_DATABASE=your_db                      # Critical - Database
DB_USERNAME=your_user                    # Critical - Database
DB_PASSWORD=your_pass                    # Critical - Database

SESSION_DRIVER=database                  # Critical - Cart won't work
FILESYSTEM_DISK=public                   # Critical - Upload won't work
```

**Everything else is optional for the demo!**

---

## 💾 **Backup Before Making Changes**

Before changing environment variables:
1. Take screenshot of current variables
2. Note down any custom values
3. Save a copy somewhere safe

---

## 🔄 **After Changing Variables**

**IMPORTANT:** Render automatically restarts when you change environment variables!
- Wait 2-3 minutes for restart
- Check logs for errors
- Test the application

---

## 📞 **Emergency Contact (If Everything Fails)**

### **Option 1: Rollback to Stable Version**
```bash
git reset --hard v1.0-capstone-stable
git push origin main --force
```

### **Option 2: Check Render Logs**
1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors (red text)

### **Option 3: Restart Service**
1. Go to Render Dashboard
2. Click "Manual Deploy"
3. Click "Clear build cache & deploy"

---

## ✅ **Pre-Demo Verification**

**30 minutes before your presentation:**

1. [ ] Visit production URL
2. [ ] Add product to cart
3. [ ] Submit cash order - works?
4. [ ] Submit QR order with image - works?
5. [ ] Login to admin - works?
6. [ ] View order in admin - works?
7. [ ] See payment proof - works?
8. [ ] Approve payment - works?

**If ALL checked = You're ready! 🎉**

**If ANY fails = Use rollback!**

---

**Created:** November 14, 2025  
**Purpose:** Production deployment safety checklist  
**Status:** Ready for capstone demo 🚀
