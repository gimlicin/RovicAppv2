# 🔐 NEXT FEATURE: Email OTP Verification

**Priority:** Medium-High  
**Estimated Time:** 3 hours  
**Difficulty:** Intermediate  
**Impact:** +5-10 capstone points

---

## 🎯 **GOAL**

Add OTP (One-Time Password) email verification during user registration to:
- ✅ Prevent fake accounts
- ✅ Verify email addresses are real
- ✅ Improve security score
- ✅ Impress capstone evaluators

---

## 📋 **USER FLOW**

### **Registration:**
```
1. User fills registration form (name, email, password)
2. Click "Register" button
3. Account created but NOT verified
4. System generates 6-digit code (e.g., 834529)
5. Email sent to user with OTP code
6. User redirected to "Verify Email" page
7. User enters 6-digit code
8. If correct: Account verified ✅
9. User can now login and use full features
```

### **Unverified User Restrictions:**
```
- Can login
- Can view products
- CANNOT checkout
- CANNOT add to cart (or can but can't checkout)
- Show banner: "Please verify your email to place orders"
```

---

## 🗄️ **DATABASE CHANGES**

### **New Table: `email_verifications`**
```php
Schema::create('email_verifications', function (Blueprint $table) {
    $table->id();
    $table->string('email')->index();
    $table->string('otp_code', 6);
    $table->timestamp('expires_at');
    $table->integer('attempts')->default(0);
    $table->timestamps();
});
```

### **Update `users` Table:**
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('is_verified')->default(false)->after('email');
    $table->timestamp('email_verified_at')->nullable()->after('is_verified');
});
```

---

## 📝 **FILES TO CREATE**

### **1. Migration**
- `database/migrations/xxxx_create_email_verifications_table.php`
- `database/migrations/xxxx_add_verification_to_users_table.php`

### **2. Model**
- `app/Models/EmailVerification.php`

### **3. Mail Class**
- `app/Mail/SendOtpCode.php` (email template for OTP)

### **4. Controller**
- `app/Http/Controllers/Auth/VerificationController.php`

### **5. Frontend Pages**
- `resources/js/pages/Auth/verify-email.tsx`

### **6. Middleware (Optional)**
- `app/Http/Middleware/EnsureEmailIsVerified.php`

---

## 🔧 **IMPLEMENTATION STEPS**

### **Step 1: Database Setup (30 min)**
```bash
# Create migrations
php artisan make:migration create_email_verifications_table
php artisan make:migration add_verification_to_users_table

# Create model
php artisan make:model EmailVerification

# Run migrations
php artisan migrate
```

### **Step 2: OTP Generation Logic (30 min)**
```php
// In VerificationController
private function generateOtp(string $email): string
{
    // Generate 6-digit code
    $code = sprintf("%06d", mt_rand(1, 999999));
    
    // Delete old codes for this email
    EmailVerification::where('email', $email)->delete();
    
    // Store new code
    EmailVerification::create([
        'email' => $email,
        'otp_code' => $code,
        'expires_at' => now()->addMinutes(10),
    ]);
    
    return $code;
}
```

### **Step 3: Email Template (30 min)**
```php
// Create mail class
php artisan make:mail SendOtpCode

// In SendOtpCode.php
public function build()
{
    return $this->subject('Verify Your Email - Rovic Meat Products')
                ->view('emails.otp-verification')
                ->with([
                    'otp_code' => $this->otpCode,
                    'expires_at' => '10 minutes'
                ]);
}
```

### **Step 4: Registration Flow Update (30 min)**
```php
// In RegisterController
public function store(Request $request)
{
    // Create user (existing code)
    $user = User::create([...]);
    
    // Generate and send OTP
    $otp = $this->generateOtp($user->email);
    Mail::to($user->email)->send(new SendOtpCode($otp));
    
    // Redirect to verification page
    return redirect()->route('verify-email')
        ->with('email', $user->email)
        ->with('success', 'Please check your email for verification code');
}
```

### **Step 5: Verification Logic (30 min)**
```php
public function verify(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'otp_code' => 'required|digits:6',
    ]);
    
    $verification = EmailVerification::where('email', $request->email)
        ->where('otp_code', $request->otp_code)
        ->where('expires_at', '>', now())
        ->first();
    
    if (!$verification) {
        return back()->withErrors([
            'otp_code' => 'Invalid or expired verification code.'
        ]);
    }
    
    // Verify user
    User::where('email', $request->email)->update([
        'is_verified' => true,
        'email_verified_at' => now(),
    ]);
    
    // Delete verification record
    $verification->delete();
    
    return redirect()->route('login')
        ->with('success', 'Email verified! You can now login.');
}
```

### **Step 6: Frontend Page (45 min)**
```typescript
// resources/js/pages/Auth/verify-email.tsx
export default function VerifyEmail({ email }) {
    const { data, setData, post, processing, errors } = useForm({
        email: email,
        otp_code: '',
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        post('/verify-email');
    };
    
    return (
        <div>
            <h1>Verify Your Email</h1>
            <p>Enter the 6-digit code sent to {email}</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    maxLength={6}
                    value={data.otp_code}
                    onChange={e => setData('otp_code', e.target.value)}
                />
                <button disabled={processing}>
                    Verify Email
                </button>
            </form>
            <button onClick={handleResend}>
                Resend Code
            </button>
        </div>
    );
}
```

### **Step 7: Checkout Protection (15 min)**
```php
// In OrderController
public function store(Request $request)
{
    // Check if authenticated user is verified
    if (auth()->check() && !auth()->user()->is_verified) {
        return back()->with('error', 
            'Please verify your email before placing an order.'
        );
    }
    
    // Continue with order creation...
}
```

---

## 🎨 **EMAIL TEMPLATE DESIGN**

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code-box {
            background: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #dc2626;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Welcome to Rovic Meat Products!</p>
        <p>Please use the following code to verify your email address:</p>
        
        <div class="code-box">
            {{ $otp_code }}
        </div>
        
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        
        <hr>
        <p style="color: #6b7280; font-size: 14px;">
            Rovic Meat Products<br>
            Fresh Quality Delivered
        </p>
    </div>
</body>
</html>
```

---

## 🔒 **SECURITY FEATURES**

### **Rate Limiting:**
```php
// Max 3 verification attempts per 5 minutes
Route::middleware('throttle:3,5')->group(function () {
    Route::post('/verify-email', [VerificationController::class, 'verify']);
    Route::post('/resend-otp', [VerificationController::class, 'resend']);
});
```

### **Brute Force Protection:**
```php
// Track failed attempts
if ($attempts >= 5) {
    return back()->withErrors([
        'otp_code' => 'Too many failed attempts. Please request a new code.'
    ]);
}
```

### **Code Expiry:**
```php
// Expire after 10 minutes
'expires_at' => now()->addMinutes(10)
```

---

## ✅ **TESTING CHECKLIST**

- [ ] User can register and receive OTP email
- [ ] Correct OTP verifies account
- [ ] Wrong OTP shows error
- [ ] Expired OTP (>10 min) shows error
- [ ] Resend code invalidates old code
- [ ] Resend code sends new email
- [ ] Rate limiting works (max 3 attempts/5 min)
- [ ] Unverified users cannot checkout
- [ ] Verified users can checkout normally
- [ ] Email template looks professional

---

## 🎯 **OPTIONAL ENHANCEMENTS**

1. **Countdown Timer:** Show "Code expires in 9:30" on frontend
2. **Auto-fill Detection:** Detect OTP from email app
3. **Remember Device:** Skip OTP on trusted devices
4. **Admin Override:** Admin can manually verify users
5. **SMS Fallback:** "Didn't receive email? Try SMS"

---

## 📊 **EXPECTED IMPACT**

### **Before:**
- Registration: Immediate account activation
- Security: Email not verified
- User Trust: Lower

### **After:**
- Registration: OTP verification required
- Security: Email verified ✅
- User Trust: Higher
- Capstone Score: +5-10 points

---

## 🚨 **IMPORTANT NOTES**

1. **Test thoroughly** - OTP systems are critical for security
2. **Don't over-complicate** - Keep it simple for capstone
3. **Document well** - Be ready to explain to professors
4. **Backup plan** - Keep old registration working in case OTP fails

---

## 💡 **PROFESSOR QUESTIONS TO PREPARE FOR**

**Q:** "Why did you add OTP verification?"  
**A:** "To prevent fake accounts and ensure email addresses are valid, improving security and data quality."

**Q:** "Why email instead of SMS?"  
**A:** "Email OTP is free, while SMS costs money per message. For a capstone project, email is more practical and still secure."

**Q:** "What if user doesn't receive the email?"  
**A:** "There's a 'Resend Code' button that sends a new OTP and invalidates the old one. The code expires after 10 minutes."

**Q:** "How do you prevent brute force attacks?"  
**A:** "Rate limiting (3 attempts per 5 minutes) and account lockout after 5 failed attempts. OTPs also expire after 10 minutes."

---

## 📅 **WHEN TO IMPLEMENT**

**Recommended:** After capstone presentation (if you have time)  
**Alternative:** Before presentation if you want to show it off  
**Time needed:** 3 hours focused work

---

**READY TO IMPLEMENT WHEN YOU ARE!** 🚀
