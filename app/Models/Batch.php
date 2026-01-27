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
        'target_published_date',
        'target_initial_review_date',
        'target_committee_review_date',
    ];
}
