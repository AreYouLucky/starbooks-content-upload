<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Log extends Model
{
    protected $table = 'logs';

    protected $fillable = [
        'request_id',
        'user_id',
        'batch_id',
        'is_approved',
        'remarks',
        'progress_status',
    ];

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(Request::class, 'request_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function logDetails(): HasMany
    {
        return $this->hasMany(LogDetail::class, 'log_id');
    }
}
