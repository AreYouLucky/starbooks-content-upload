<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogDetail extends Model
{
    protected $table = 'log_details';

    protected $fillable = [
        'approval_request_id',
        'content_reviewer_id',
        'content_log_id',
        'remarks',
    ];
}
