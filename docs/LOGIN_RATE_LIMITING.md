# Progressive Login Rate Limiting

## Overview

This document describes the progressive login rate limiting system implemented to protect against brute force attacks. The system locks out users after 5 failed login attempts with progressively increasing timeout durations.

## Features

- ✅ **Progressive Timeout**: Each lockout increases the timeout duration by 15 seconds
- ✅ **Live Countdown Timer**: Real-time visual countdown in MM:SS format
- ✅ **Form Lockout**: All form fields disabled during lockout period
- ✅ **Visual Feedback**: Red warning banner with alert icon
- ✅ **Auto-Unlock**: Automatically re-enables form when timer expires
- ✅ **Per-User Tracking**: Tracks attempts by email + IP address combination
- ✅ **Cache-Based**: Uses Laravel Cache for high performance

## Timeout Schedule

| Lockout # | Timeout Duration | Calculation |
|-----------|------------------|-------------|
| 1st | 30 seconds | 30 + (0 × 15) |
| 2nd | 45 seconds | 30 + (1 × 15) |
| 3rd | 60 seconds | 30 + (2 × 15) |
| 4th | 75 seconds | 30 + (3 × 15) |
| 5th | 90 seconds | 30 + (4 × 15) |
| ... | +15s each | 30 + ((n-1) × 15) |

**Formula**: `timeout = 30 + ((lockout_count - 1) × 15)`

## How It Works

### 1. Failed Login Tracking

When a user enters wrong credentials:
1. System increments failed attempt counter for that email+IP
2. Counter stored in cache for 10 minutes
3. After 5 failed attempts, lockout is triggered

### 2. Lockout Mechanism

When lockout is triggered:
1. Calculate timeout duration based on lockout count
2. Store lockout timestamp in cache
3. Reset attempt counter to 0 (but keep lockout count)
4. Return error message with remaining seconds

### 3. Lockout Check

Before processing login:
1. Check if there's an active lockout (has `available_at` timestamp)
2. If locked out, throw validation error with countdown
3. If not locked out, check if attempts >= 5
4. Allow login attempt if both checks pass

### 4. Successful Login

When user successfully logs in:
1. Clear all throttle data (attempts, lockout count, timestamps)
2. User can start fresh on next failed attempt

## Files Modified/Created

### New Files

1. **`app/Services/LoginThrottleService.php`**
   - Core service handling all throttle logic
   - Methods: `hit()`, `attempts()`, `lockout()`, `tooManyAttempts()`, `availableIn()`, `clear()`

2. **`lang/en/auth.php`**
   - Authentication error messages
   - Progressive throttle messages

3. **`docs/LOGIN_RATE_LIMITING.md`**
   - This documentation file

### Modified Files

1. **`app/Http/Requests/Auth/LoginRequest.php`**
   - Integrated `LoginThrottleService`
   - Added lockout triggering logic
   - Updated error messages

2. **`resources/js/pages/auth/login.tsx`**
   - Added countdown timer state management
   - Added lockout warning banner UI
   - Disabled form fields during lockout
   - Updated button to show "Locked (Xs)"

3. **`routes/web.php`**
   - Added `/test-throttle` debug endpoint (can be removed in production)

## User Experience

### Normal Login
```
Email: [input field]
Password: [input field]
☐ Remember me
[Log in]
```

### During Lockout
```
┌─────────────────────────────────────────┐
│ ⚠️ Account Temporarily Locked           │
│                                          │
│ Too many failed login attempts.         │
│ Please wait before trying again.        │
│                                          │
│ 0:30 remaining                          │
└─────────────────────────────────────────┘

Email: [disabled input]
Password: [disabled input]
☐ Remember me (disabled)
[Locked (30s)] (disabled button)
```

Timer counts down: `0:30` → `0:29` → `0:28` → ... → `0:00`

When timer reaches 0:
- Banner disappears
- Form fields re-enable
- Button shows "Log in" again

## Security Benefits

| Threat | Protection |
|--------|------------|
| **Brute Force Attacks** | Progressive timeouts make it impractical (5 attempts = 30s, 10 attempts = 75s) |
| **Dictionary Attacks** | Limited to 5 attempts per 30+ seconds |
| **Credential Stuffing** | Per-email + IP tracking prevents mass testing |
| **Automated Bots** | Increasing timeouts frustrate automation |

## Configuration

### Adjustable Parameters

In `app/Services/LoginThrottleService.php`:

```php
// Base timeout (default: 30 seconds)
$baseTimeout = 30;

// Additional timeout per lockout (default: 15 seconds)
$additionalTimeout = ($lockoutCount - 1) * 15;

// Cache expiration (default: 30 minutes for lockout count, 10 minutes for attempts)
Cache::put($key, $value, now()->addMinutes(30));
```

In `app/Http/Requests/Auth/LoginRequest.php`:

```php
// Max attempts before lockout (default: 5)
$maxAttempts = 5;
```

## Testing

### Test Progressive Lockouts

1. Go to login page
2. Enter email and **wrong** password
3. Click "Log in" 5 times quickly
4. **Expected Result**: Locked out for 30 seconds
5. Wait for timer to expire
6. Repeat steps 2-3
7. **Expected Result**: Locked out for 45 seconds
8. Repeat again
9. **Expected Result**: Locked out for 60 seconds

### Test Successful Login Clears Data

1. Get locked out
2. Wait for timer to expire
3. Login with **correct** credentials
4. Logout
5. Try wrong password again
6. **Expected Result**: Starts fresh at attempt #1

## Cache Storage

The system uses Laravel Cache with these keys:

```
login_throttle:attempts:{email|ip}         → Attempt count
login_throttle:lockout_count:{email|ip}    → Number of lockouts
login_throttle:available_at:{email|ip}     → Unix timestamp when available
```

**Example**:
```
login_throttle:attempts:admin@example.com|127.0.0.1 = 3
login_throttle:lockout_count:admin@example.com|127.0.0.1 = 2
login_throttle:available_at:admin@example.com|127.0.0.1 = 1700123456
```

## Monitoring

### Check Current Lockouts (Laravel Tinker)

```php
php artisan tinker

$throttle = app(\App\Services\LoginThrottleService::class);
$key = 'admin@example.com|127.0.0.1';

$throttle->attempts($key);      // Current attempt count
$throttle->lockoutCount($key);  // Number of lockouts
$throttle->availableIn($key);   // Seconds until available
```

### Clear Specific User Lockout

```php
$throttle->clear('admin@example.com|127.0.0.1');
```

## Production Deployment

### Pre-Deployment Checklist

- [x] All tests passing
- [x] Debug logging removed
- [x] Cache driver configured (database/redis)
- [x] Error messages user-friendly
- [x] Countdown timer works
- [ ] Monitor lockout metrics after deployment

### Environment Requirements

- Laravel 10+
- Cache driver: `database` or `redis` (recommended for production)
- PHP 8.1+

### Post-Deployment

1. Monitor lockout frequency in logs
2. Adjust `$maxAttempts` or timeouts if needed
3. Consider adding admin panel to view lockout statistics
4. Optional: Add email notifications on lockout

## Future Enhancements

- [ ] Admin dashboard to view lockout statistics
- [ ] Email notification to user when locked out
- [ ] IP whitelist for admins (bypass rate limiting)
- [ ] Configurable timeout values via `.env`
- [ ] CAPTCHA after N lockouts
- [ ] Slack/Discord notifications for suspicious activity

## Troubleshooting

### Lockout not triggering

1. Check cache driver is configured: `config('cache.default')`
2. Verify cache table exists: `php artisan cache:table` then `php artisan migrate`
3. Clear cache: `php artisan cache:clear`
4. Check logs: `tail -f storage/logs/laravel.log`

### Timer not counting down

1. Check browser console for JavaScript errors
2. Verify `npm run build` was run after changes
3. Clear browser cache

### Lockout persists after timer expires

1. Check system time on server
2. Clear cache: `php artisan cache:clear`
3. Verify cache expiration is working

## Credits

Implemented: November 17, 2025  
Version: 1.0.0  
Status: Production Ready ✅
