<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Request extends Model
{
    protected $table = 'requests';

    protected $fillable = [
        'approval_status',
        'HoldingsID',
        'MaterialType',
        'Title',
        'FileName',
        'SubTitle',
        'SeriesTitle',
        'BibliographicNote',
        'Contents',
        'Abstracts',
        'JournalTitle',
        'AgencyCode',
        'BroadClass',
        'VolumeNo',
        'IssueNo',
        'IssueDate',
        'Author',
        'Type',
        'Subject',
        'EditDate',
        'initial_reviewed_date',
        'quality_assurance_date',
        'initial_reviewer_id',
        'initial_reviewed_assigned_date',
        'quality_assurance_reviewer_id',
        'quality_assurance_assigned_date',
        'published_at',
        'uploaded_by',
        'batch_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'initial_reviewed_date' => 'date',
            'quality_assurance_date' => 'date',
            'initial_reviewed_assigned_date' => 'datetime',
            'quality_assurance_assigned_date' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(Log::class, 'request_id');
    }

    public function initialReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initial_reviewer_id');
    }

    public function qualityAssuranceReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'quality_assurance_reviewer_id');
    }
}
