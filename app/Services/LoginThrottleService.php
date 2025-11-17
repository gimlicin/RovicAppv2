<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class LoginThrottleService
{
    /**
     * Get the number of failed login attempts for a key
     */
    public function attempts(string $key): int
    {
        return Cache::get($this->attemptsKey($key), 0);
    }

    /**
     * Increment failed login attempts
     */
    public function hit(string $key): void
    {
        $attempts = $this->attempts($key) + 1;
        
        // Store attempts with expiration (10 minutes after last attempt)
        Cache::put($this->attemptsKey($key), $attempts, now()->addMinutes(10));
    }

    /**
     * Clear all login attempt data for a key
     */
    public function clear(string $key): void
    {
        Cache::forget($this->attemptsKey($key));
        Cache::forget($this->lockoutCountKey($key));
        Cache::forget($this->availableAtKey($key));
    }

    /**
     * Check if the key has too many attempts
     */
    public function tooManyAttempts(string $key, int $maxAttempts = 5): bool
    {
        // FIRST: Check if there's an active lockout (most important!)
        if (Cache::has($this->availableAtKey($key))) {
            return true;
        }
        
        // SECOND: Check attempt count
        $attempts = $this->attempts($key);
        
        if ($attempts < $maxAttempts) {
            return false;
        }

        // Has max attempts but no active lockout yet
        return true;
    }

    /**
     * Get seconds until the key is available again
     */
    public function availableIn(string $key): int
    {
        $availableAt = Cache::get($this->availableAtKey($key));
        
        if (!$availableAt) {
            return 0;
        }

        $seconds = $availableAt - time();
        return max(0, $seconds);
    }

    /**
     * Lock out the user with progressive timeout
     */
    public function lockout(string $key): void
    {
        $lockoutCount = $this->lockoutCount($key) + 1;
        
        // Calculate progressive timeout
        // First lockout: 30 seconds
        // Each subsequent lockout: +15 seconds (45s, 60s, 75s, etc.)
        $baseTimeout = 30;
        $additionalTimeout = ($lockoutCount - 1) * 15;
        $totalTimeout = $baseTimeout + $additionalTimeout;
        
        $availableAt = time() + $totalTimeout;
        
        // Store lockout data
        Cache::put($this->lockoutCountKey($key), $lockoutCount, now()->addMinutes(30));
        Cache::put($this->availableAtKey($key), $availableAt, now()->addSeconds($totalTimeout));
        
        // Reset attempts counter but keep lockout count for progressive tracking
        Cache::put($this->attemptsKey($key), 0, now()->addMinutes(10));
    }

    /**
     * Get the number of times this key has been locked out
     */
    public function lockoutCount(string $key): int
    {
        return Cache::get($this->lockoutCountKey($key), 0);
    }

    /**
     * Get the total timeout duration for current lockout
     */
    public function currentTimeoutDuration(string $key): int
    {
        $lockoutCount = $this->lockoutCount($key);
        
        if ($lockoutCount === 0) {
            return 0;
        }
        
        $baseTimeout = 30;
        $additionalTimeout = ($lockoutCount - 1) * 15;
        return $baseTimeout + $additionalTimeout;
    }

    /**
     * Get cache key for attempts
     */
    protected function attemptsKey(string $key): string
    {
        return "login_throttle:attempts:{$key}";
    }

    /**
     * Get cache key for lockout count
     */
    protected function lockoutCountKey(string $key): string
    {
        return "login_throttle:lockout_count:{$key}";
    }

    /**
     * Get cache key for available at timestamp
     */
    protected function availableAtKey(string $key): string
    {
        return "login_throttle:available_at:{$key}";
    }
}
