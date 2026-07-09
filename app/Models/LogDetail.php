<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogDetail extends Model
{
    protected $table = 'content_log_details';

    protected $fillable = [
        'approval_status',
        'approval_request_id',
        'content_reviewer_id',
        'content_log_id',
        'is_passed',
        'description',
        'remarks',
    ];

    public function approvalLog(): BelongsTo
    {
        return $this->belongsTo(ApprovalLog::class, 'content_log_id');
    }
}
