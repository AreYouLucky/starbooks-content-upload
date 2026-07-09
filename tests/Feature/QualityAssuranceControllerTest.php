<?php

use App\Models\ApprovalLog;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\LogDetail;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Schema::table('content_batches', function (Blueprint $table) {
        $table->string('target_quality_approval_date')->nullable();
        $table->dateTime('quality_approval_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
    });

    Schema::table('content_approval_logs', function (Blueprint $table) {
        $table->integer('progress_status')->default(0);
    });
});

function createQualityUser(): User
{
    return User::query()->create([
        'username' => 'quality_'.Str::lower(Str::random(8)),
        'full_name' => 'Quality Reviewer '.Str::random(6),
        'delivery_unit' => 'QA',
        'role' => 'quality',
        'designation' => 'Reviewer',
        'task_description' => 'Quality assurance test',
        'password' => Hash::make('password'),
    ]);
}

function createQualityBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'QA Batch '.Str::upper(Str::random(4)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Quality assurance test batch',
        'target_published_date' => '2026-07-15',
        'target_initial_review_date' => '2026-06-15',
        'target_committee_review_date' => '2026-06-22',
        'target_quality_approval_date' => '2026-06-29',
        'status' => 'for quality approval',
        'is_active' => 1,
    ], $attributes));
}

function createQualityRequest(Batch $batch, int $approvalStatus): ApprovalRequest
{
    return ApprovalRequest::query()->create([
        'HoldingsID' => 'QA-'.Str::upper(Str::random(8)),
        'Title' => 'Quality Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ]);
}

function createQualityLog(
    ApprovalRequest $approvalRequest,
    User $user,
    int $progressStatus,
): ApprovalLog {
    return ApprovalLog::query()->forceCreate([
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'batch_id' => $approvalRequest->batch_id,
        'is_approved' => $progressStatus === 4,
        'approval_status' => $progressStatus === 4 ? 2 : 3,
        'progress_status' => $progressStatus,
        'remarks' => 'Quality assurance decision.',
    ]);
}

test('quality assurance index returns stage-specific request counts', function () {
    $batch = createQualityBatch(['batch_name' => 'Science QA Batch']);
    $user = createQualityUser();
    createQualityRequest($batch, 2);
    $approved = createQualityRequest($batch, 4);
    $disapproved = createQualityRequest($batch, 5);
    $committeeRejected = createQualityRequest($batch, 3);
    createQualityLog($approved, $user, 4);
    createQualityLog($disapproved, $user, 5);
    createQualityLog($committeeRejected, $user, 3);
    createQualityBatch(['status' => 'for initial review']);

    $this->actingAs($user)
        ->getJson('/quality-assurance-batches')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.pending', 1)
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 1)
        ->assertJsonPath('analytics.for_quality_assurance', 1);
});

test('quality assurance index includes reviewed batches after unreviewed batches', function () {
    $reviewedBatch = createQualityBatch([
        'batch_name' => 'Already Reviewed QA Batch',
        'status' => 'for publishing',
        'quality_approval_date' => '2026-06-30 08:00:00',
        'created_at' => now(),
    ]);
    $unreviewedBatch = createQualityBatch([
        'batch_name' => 'Current QA Batch',
        'status' => 'for quality approval',
        'created_at' => now()->subDay(),
    ]);
    createQualityRequest($reviewedBatch, 4);
    createQualityRequest($unreviewedBatch, 2);
    createQualityBatch([
        'batch_name' => 'Committee Batch',
        'status' => 'for initial review',
    ]);
    $user = createQualityUser();

    $this->actingAs($user)
        ->getJson('/quality-assurance-batches')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.batch_name', 'Current QA Batch')
        ->assertJsonPath('data.1.batch_name', 'Already Reviewed QA Batch')
        ->assertJsonPath('analytics.for_quality_assurance', 1)
        ->assertJsonPath('analytics.reviewed', 1);
});

test('quality assurance request list excludes committee-disapproved requests', function () {
    $batch = createQualityBatch(['batch_name' => 'Filtered QA Batch']);
    $user = createQualityUser();
    $pending = createQualityRequest($batch, 2);
    $qualityReviewed = createQualityRequest($batch, 4);
    $committeeRejected = createQualityRequest($batch, 3);
    createQualityLog($qualityReviewed, $user, 4);
    createQualityLog($committeeRejected, $user, 3);

    $this->actingAs($user)
        ->get('/view-quality-assurance-batch/Filtered%20QA%20Batch')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('quality-assurance/requests-list')
            ->has('approval_requests', 2)
            ->where('approval_requests.0.id', $pending->id)
            ->where('approval_requests.1.id', $qualityReviewed->id));
});

test('quality assurance submission stores a separate quality-stage decision', function () {
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 2);
    $user = createQualityUser();

    $this->actingAs($user)
        ->postJson('/submit-quality-assurance-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'disapproval_reasons' => ['Completeness', 'Quality'],
            'remarks' => 'Quality corrections are required.',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Quality assurance review successfully saved.');

    expect($approvalRequest->refresh()->approval_status)->toBe(5);

    $this->assertDatabaseHas('content_approval_logs', [
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'progress_status' => 5,
        'approval_status' => 5,
        'remarks' => 'Quality corrections are required.',
    ]);
    $this->assertDatabaseHas('content_log_details', [
        'approval_request_id' => $approvalRequest->id,
        'approval_status' => 5,
        'description' => 'Completeness',
        'remarks' => 'Completeness',
    ]);
});

test('quality assurance disapproval requires remarks', function () {
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 2);
    $user = createQualityUser();

    $this->actingAs($user)
        ->postJson('/submit-quality-assurance-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'disapproval_reasons' => ['Completeness'],
            'remarks' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['remarks']);
});

test('quality assurance batch can only be forwarded after pending reviews are complete', function () {
    $batch = createQualityBatch(['batch_name' => 'Publishing QA Batch']);
    $approvalRequest = createQualityRequest($batch, 2);
    $user = createQualityUser();

    $this->actingAs($user)
        ->postJson('/forward-to-publishing', ['batchName' => $batch->batch_name])
        ->assertUnprocessable();

    $approvalRequest->update(['approval_status' => 4]);

    $this->actingAs($user)
        ->postJson('/forward-to-publishing', ['batchName' => $batch->batch_name])
        ->assertOk()
        ->assertJsonPath('message', 'Batch successfully forwarded for publishing.');

    expect($batch->refresh()->status)->toBe('for publishing')
        ->and($batch->quality_approval_date)->not->toBeNull();
});

test('quality assurance report returns only quality-stage review logs', function () {
    $batch = createQualityBatch([
        'batch_name' => 'Reported QA Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'for publishing',
    ]);
    $approvalRequest = createQualityRequest($batch, 4);
    $user = createQualityUser();

    createQualityLog($approvalRequest, $user, 2);
    $qualityLog = createQualityLog($approvalRequest, $user, 4);

    LogDetail::query()->forceCreate([
        'approval_status' => 4,
        'approval_request_id' => $approvalRequest->id,
        'content_log_id' => $qualityLog->id,
        'content_reviewer_id' => $user->id,
        'is_passed' => true,
        'description' => 'Quality',
        'remarks' => 'Passed quality assurance.',
    ]);

    $this->actingAs($user)
        ->getJson('/generate-quality-assurance-report?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'batches')
        ->assertJsonCount(1, 'batches.0.approval_requests')
        ->assertJsonCount(1, 'batches.0.approval_requests.0.approval_logs')
        ->assertJsonPath(
            'batches.0.approval_requests.0.approval_logs.0.progress_status',
            4
        )
        ->assertJsonPath(
            'batches.0.approval_requests.0.approval_logs.0.reviewer.full_name',
            $user->full_name
        )
        ->assertJsonCount(
            1,
            'batches.0.approval_requests.0.approval_logs.0.log_details'
        )
        ->assertJsonCount(1, 'records');
});
