<?php

use App\Models\ArchivedRecord;
use App\Models\Log;
use App\Models\LogDetail;
use App\Models\Request;
use Illuminate\Support\Facades\Schema;

test('workflow tables and columns use canonical names', function () {
    expect(Schema::hasTable('users'))->toBeTrue()
        ->and(Schema::hasTable('batches'))->toBeTrue()
        ->and(Schema::hasTable('requests'))->toBeTrue()
        ->and(Schema::hasTable('logs'))->toBeTrue()
        ->and(Schema::hasTable('log_details'))->toBeTrue()
        ->and(Schema::hasTable('archived_records'))->toBeTrue()
        ->and(Schema::hasTable('content_reviewers'))->toBeFalse()
        ->and(Schema::hasTable('content_batches'))->toBeFalse()
        ->and(Schema::hasTable('content_approval_requests'))->toBeFalse()
        ->and(Schema::hasTable('content_approval_logs'))->toBeFalse()
        ->and(Schema::hasTable('content_log_details'))->toBeFalse()
        ->and(Schema::hasColumns('requests', ['initial_reviewed_date', 'quality_assurance_date', 'initial_reviewer_id', 'initial_reviewed_assigned_date', 'quality_assurance_reviewer_id', 'quality_assurance_assigned_date']))->toBeTrue()
        ->and(Schema::hasColumns('batches', ['start_date', 'target_shortlist_date', 'shortlisted_date', 'target_initial_review_date', 'initial_reviewed_date', 'target_quality_approval_date', 'quality_approval_date', 'target_published_date', 'published_date', 'status', 'is_active', 'is_dost']))->toBeTrue()
        ->and(Schema::hasColumns('logs', ['request_id', 'user_id', 'progress_status']))->toBeTrue()
        ->and(Schema::hasColumns('log_details', ['request_id', 'log_id', 'user_id']))->toBeTrue()
        ->and(Schema::hasColumn('batches', 'target_committee_review_date'))->toBeFalse()
        ->and((new Request)->getTable())->toBe('requests')
        ->and((new Log)->getTable())->toBe('logs')
        ->and((new LogDetail)->getTable())->toBe('log_details')
        ->and((new ArchivedRecord)->getTable())->toBe('archived_records');
});
