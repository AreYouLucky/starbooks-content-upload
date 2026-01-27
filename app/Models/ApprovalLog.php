<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
