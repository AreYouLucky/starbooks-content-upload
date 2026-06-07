<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalLog extends Model
{
    protected $table = 'content_approval_logs';

    protected $fillable = [
        'approval_request_id',
        'content_reviewer_id',
        'batch_id',
        'is_approved',
        'remarks',
    ];

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'content_reviewer_id');
    }

    public function logDetails(): HasMany
    {
        return $this->hasMany(LogDetail::class, 'content_log_id');
    }
}
