<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogDetail extends Model
{
    protected $table = 'log_details';

    protected $fillable = [
        'approval_status',
        'approval_request_id',
        'content_log_id',
        'content_reviewer_id',
        'is_passed',
        'description',
        'remarks'
    ];
}
