# 🚀 Render.com Deployment Guide - RovicAppv2

## ✅ Files Created for Render Deployment:
- `render.yaml` - Service configuration
- `build.sh` - Build script  
- `.env.render` - Environment template
- Updated `composer.json` - Production script

## 📋 Step-by-Step Deployment:

### **Step 1: Push Code to GitHub**
```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Add Render.com deployment configuration"
git push origin main
```

### **Step 2: Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub account (recommended)
3. Authorize Render to access your repositories

### **Step 3: Create New Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `RovicAppv2`
3. Choose branch: `main`
4. **Service Configuration:**
   - **Name:** `rovic-meatshop`
   - **Region:** Choose closest to your location
   - **Branch:** `main`
   - **Runtime:** `PHP`

### **Step 4: Build Configuration**
```yaml
Build Command: composer production
Start Command: php artisan serve --host=0.0.0.0 --port=$PORT
```

### **Step 5: Environment Variables**
Add these in Render Dashboard → Environment:

**Required Variables:**
```env
APP_NAME=Rovic Meatshop
APP_ENV=production  
APP_DEBUG=false
DB_CONNECTION=pgsql
SESSION_DRIVER=database
SESSION_LIFETIME=480
CACHE_STORE=database
QUEUE_CONNECTION=database
```

**Mail Configuration (Gmail example):**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME=Rovic Meatshop
```

### **Step 6: Create PostgreSQL Database**
1. In Render Dashboard → "New +" → "PostgreSQL"
2. **Database Name:** `rovic-postgres`
3. **Database Name:** `rovic_meatshop`
4. **User:** `rovic_user`
5. **Region:** Same as web service
6. Copy the `DATABASE_URL` to web service environment

### **Step 7: Deploy**
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for build to complete (~5-10 minutes)

### **Step 8: Run Database Setup**
Once deployed, run these commands in Render console:

```bash
# Run migrations
php artisan migrate --force

# Seed database with sample data  
php artisan db:seed --force

# Create storage link
php artisan storage:link
```

## 🎯 Expected URLs:
- **Application:** https://rovic-meatshop.onrender.com
- **Admin:** https://rovic-meatshop.onrender.com/admin/dashboard

## 📧 Post-Deployment Setup:

### **Gmail SMTP Setup:**
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: Google Account → Security → App passwords
3. Use app password in `MAIL_PASSWORD` environment variable

### **Test Email Notifications:**
1. Place a test order
2. Check if order confirmation email is sent
3. Test admin notification emails

## 🔍 Troubleshooting:

### **Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies in `composer.json` and `package.json`
- Verify PHP version compatibility

### **Database Connection Issues:**
- Ensure `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Verify database migrations completed

### **File Upload Issues:**
- Ensure `php artisan storage:link` was run
- Check file permissions in production
- Consider upgrading to cloud storage for production

## 📊 Performance Tips:
- **Warm-up:** Access app before demos to avoid cold starts
- **Monitoring:** Check Render logs for any issues
- **Optimization:** Consider upgrading to paid plan for better performance

## 💰 Pricing:
- **Web Service:** Free (with limitations) / $7/month (faster, always-on)
- **PostgreSQL:** Free / $7/month (more storage)
- **Total Free:** $0/month for capstone project

---
**🎯 Goal: Live e-commerce application at https://rovic-meatshop.onrender.com**
