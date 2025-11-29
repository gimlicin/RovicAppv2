<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Contracts\Auth\Authenticatable;

class ActivityLogger
{
    /**
     * Record an activity log entry.
     *
     * @param string $action Short action key, e.g. 'product_created'.
     * @param string|null $description Human-readable description of what happened.
     * @param object|null $subject Optional model instance related to the action.
     * @param array $extra Additional data to merge into the payload.
     */
    public static function log(string $action, ?string $description = null, object $subject = null, array $extra = []): void
    {
        $user = auth()->user();

        $data = [
            'user_id' => $user instanceof Authenticatable ? $user->getAuthIdentifier() : null,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject && isset($subject->id) ? $subject->id : null,
            'description' => $description,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->header('User-Agent'),
        ];

        if (!empty($extra)) {
            $data = array_merge($data, $extra);
        }

        ActivityLog::create($data);
    }
}
