<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    protected $table = 'content_batches';
    protected $fillable = [
        'batch_name',
        'content_source',
        'batch_description',
        'target_shortlist_date',
        'shortlisted_date',
        'target_initial_review_date',
        'initial_reviewed_date',
        'target_quality_approval_date',
        'quality_approval_date',
        'target_published_date',
        'published_date',
        'status',
        'is_active',
        'quarter',
        'year',
        'is_dost',
        'start_date'
    ];
}
