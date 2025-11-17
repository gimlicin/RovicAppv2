<?php

namespace App\Http\Requests\Auth;

use App\Services\LoginThrottleService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $throttle = app(LoginThrottleService::class);
        $this->ensureIsNotRateLimited($throttle);

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            $throttle->hit($this->throttleKey());
            
            // Check if should be locked out after this failed attempt
            $maxAttempts = 5;
            $key = $this->throttleKey();
            $attempts = $throttle->attempts($key);
            
            if ($attempts >= $maxAttempts) {
                $throttle->lockout($key);
                $this->ensureIsNotRateLimited($throttle); // This will throw the lockout exception
            }

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $throttle->clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(LoginThrottleService $throttle): void
    {
        if (! $throttle->tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = $throttle->availableIn($this->throttleKey());
        $lockoutCount = $throttle->lockoutCount($this->throttleKey());

        $message = $lockoutCount === 1 
            ? "Too many login attempts. Account locked for {$seconds} seconds (Lockout #{$lockoutCount})."
            : "Too many login attempts. Account locked for {$seconds} seconds. This is lockout #{$lockoutCount} - the timeout increases with each failed attempt.";

        throw ValidationException::withMessages([
            'email' => $message,
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
