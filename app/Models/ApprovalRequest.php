<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    protected $table = 'content_approval_requests';

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
        'committee_reviewed_date',
        'committee_reviewer_id',
        'quality_assurance_reviewer_id',
        'uploaded_by',
        'batch_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'committee_reviewed_date' => 'date',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class, 'approval_request_id');
    }

    public function committeeReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'committee_reviewer_id');
    }

    public function qualityAssuranceReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'quality_assurance_reviewer_id');
    }
}
