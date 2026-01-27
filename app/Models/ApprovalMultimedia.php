<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalMultimedia extends Model
{
    protected $table = 'content_approval_multimedias';
    protected $fillable = [
        'HoldingsID',
        'FileName',
        'FileType',
        'Extension',
        'DateModified',
        'NumPages',
    ];
}
