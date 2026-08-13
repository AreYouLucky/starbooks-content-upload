<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogDetail extends Model
{
    protected $table = 'log_details';

    protected $fillable = [
        'approval_status',
        'request_id',
        'user_id',
        'log_id',
        'is_passed',
        'description',
        'remarks',
    ];

    public function approvalLog(): BelongsTo
    {
        return $this->belongsTo(Log::class, 'log_id');
    }
}
