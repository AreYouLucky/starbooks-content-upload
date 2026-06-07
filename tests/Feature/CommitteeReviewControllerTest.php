<?php

use App\Models\ApprovalLog;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\LogDetail;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Schema::table('content_batches', function (Blueprint $table) {
        $table->string('initial_reviewed_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
    });
});

function createCommitteeUser(): User
{
    return User::query()->create([
        'username' => 'committee_'.Str::lower(Str::random(8)),
        'full_name' => 'Committee Test '.Str::random(6),
        'delivery_unit' => 'QA',
        'role' => 'committee',
        'designation' => 'Reviewer',
        'task_description' => 'Committee review test',
        'password' => Hash::make('password'),
    ]);
}

function createCommitteeBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Batch '.Str::upper(Str::random(4)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Committee review test batch',
        'target_published_date' => '2026-05-29',
        'target_initial_review_date' => '2026-05-19',
        'target_committee_review_date' => '2026-05-22',
        'status' => 'for initial review',
        'is_active' => 1,
    ], $attributes));
}

function createApprovalRequestForBatch(Batch $batch, int $approvalStatus): ApprovalRequest
{
    return ApprovalRequest::query()->create([
        'HoldingsID' => 'HOLD-'.Str::upper(Str::random(8)),
        'Title' => 'Approval Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ]);
}

test('committee review index returns approval request status counts per batch', function () {
    $batch = createCommitteeBatch([
        'batch_name' => 'Science Committee Batch',
    ]);

    createApprovalRequestForBatch($batch, 1);
    createApprovalRequestForBatch($batch, 1);
    createApprovalRequestForBatch($batch, 2);
    createApprovalRequestForBatch($batch, 3);
    createApprovalRequestForBatch($batch, 0);

    createCommitteeBatch([
        'batch_name' => 'Shortlisting Batch',
        'status' => 'for shortlisting',
    ]);

    $user = createCommitteeUser();

    $this->actingAs($user)
        ->getJson('/committee-review-batches')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.pending', 2)
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 1);
});

test('committee review index filters batches without changing their request counts', function () {
    $scienceBatch = createCommitteeBatch([
        'batch_name' => 'Science Committee Batch',
        'batch_description' => 'Filtered committee work',
    ]);
    $historyBatch = createCommitteeBatch([
        'batch_name' => 'History Committee Batch',
        'batch_description' => 'Should not match',
    ]);

    createApprovalRequestForBatch($scienceBatch, 2);
    createApprovalRequestForBatch($historyBatch, 3);

    $user = createCommitteeUser();

    $this->actingAs($user)
        ->getJson('/committee-review-batches?search=Science')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.batch_name', 'Science Committee Batch')
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 0);
});

test('committee report returns reviewed requests with their logs and details', function () {
    $batch = createCommitteeBatch([
        'batch_name' => 'Reviewed Committee Batch',
        'quarter' => 'Q3',
        'year' => '2026',
    ]);
    $approvedRequest = createApprovalRequestForBatch($batch, 2);
    createApprovalRequestForBatch($batch, 1);
    createCommitteeBatch([
        'batch_name' => 'Different Quarter Batch',
        'quarter' => 'Q4',
        'year' => '2026',
    ]);
    $user = createCommitteeUser();

    $approvalLog = ApprovalLog::query()->create([
        'approval_request_id' => $approvedRequest->id,
        'content_reviewer_id' => $user->id,
        'batch_id' => $batch->id,
        'is_approved' => true,
        'approval_status' => 2,
        'remarks' => 'Approved by the committee.',
    ]);

    LogDetail::query()->create([
        'approval_status' => 2,
        'approval_request_id' => $approvedRequest->id,
        'content_log_id' => $approvalLog->id,
        'content_reviewer_id' => $user->id,
        'is_passed' => true,
        'description' => 'Accuracy',
        'remarks' => 'Passed.',
    ]);

    $this->actingAs($user)
        ->getJson('/generate-committee-report?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'batches')
        ->assertJsonCount(1, 'batches.0.approval_requests')
        ->assertJsonCount(1, 'batches.0.approval_requests.0.approval_logs')
        ->assertJsonCount(1, 'batches.0.approval_requests.0.approval_logs.0.log_details')
        ->assertJsonPath(
            'batches.0.approval_requests.0.approval_logs.0.reviewer.full_name',
            $user->full_name
        )
        ->assertJsonCount(1, 'records')
        ->assertJsonPath('records.0.id', $approvedRequest->id);
});

test('committee review submission updates request and stores disapproval reasons', function () {
    $batch = createCommitteeBatch();
    $approvalRequest = createApprovalRequestForBatch($batch, 1);
    $user = createCommitteeUser();

    $this->actingAs($user)
        ->postJson('/submit-committee-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'disapproval_reasons' => ['Accuracy', 'Recency'],
            'remarks' => 'Needs corrections before approval.',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Review successfully saved.');

    $approvalRequest->refresh();
    expect($approvalRequest->approval_status)->toBe(3)
        ->and($approvalRequest->committee_reviewed_date)->toBe(Carbon::today()->toDateString());

    $logId = DB::table('content_approval_logs')->value('id');

    $this->assertDatabaseHas('content_approval_logs', [
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'batch_id' => $batch->id,
        'is_approved' => false,
        'approval_status' => 3,
        'remarks' => 'Needs corrections before approval.',
    ]);

    $this->assertDatabaseHas('content_log_details', [
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'content_log_id' => $logId,
        'approval_status' => 3,
        'description' => 'Accuracy',
        'remarks' => 'Accuracy',
    ]);
});

test('committee review submission requires reasons when disapproved', function () {
    $batch = createCommitteeBatch();
    $approvalRequest = createApprovalRequestForBatch($batch, 1);
    $user = createCommitteeUser();

    $this->actingAs($user)
        ->postJson('/submit-committee-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'remarks' => 'Needs corrections before approval.',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['disapproval_reasons']);

    $approvalRequest->refresh();
    expect($approvalRequest->approval_status)->toBe(1);
});
