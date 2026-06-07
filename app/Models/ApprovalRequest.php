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
        'uploaded_by',
        'batch_id',
        'is_active',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function approvalLogs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class, 'approval_request_id');
    }
}
