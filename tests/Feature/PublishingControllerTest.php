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
        $table->dateTime('quality_approval_date')->nullable();
        $table->dateTime('published_date')->nullable();
        $table->dateTime('shortlisted_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
    });

    Schema::table('content_approval_logs', function (Blueprint $table) {
        $table->integer('progress_status')->default(0);
    });

    if (! Schema::hasTable('tblrecord')) {
        Schema::create('tblrecord', function (Blueprint $table) {
            $table->id();
            $table->string('Title')->nullable();
            $table->string('Author')->nullable();
            $table->string('HoldingsID')->nullable();
            $table->text('Contents')->nullable();
            $table->string('MaterialType')->nullable();
            $table->string('JournalTitle')->nullable();
            $table->string('Subject')->nullable();
            $table->string('SubTitle')->nullable();
            $table->string('VolumeNo')->nullable();
            $table->string('IssueNo')->nullable();
            $table->string('IssueDate')->nullable();
            $table->string('AgencyCode')->nullable();
            $table->string('Type')->nullable();
            $table->text('Abstracts')->nullable();
        });
    }
});

function createPublishingUser(): User
{
    return User::query()->create([
        'username' => 'publishing_'.Str::lower(Str::random(8)),
        'full_name' => 'Publishing User '.Str::random(6),
        'delivery_unit' => 'Publishing',
        'role' => 'stii_admin',
        'designation' => 'Publisher',
        'task_description' => 'Publishing test',
        'password' => Hash::make('password'),
    ]);
}

function createPublishingBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Publishing Batch '.Str::upper(Str::random(4)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Publishing test batch',
        'target_published_date' => '2026-07-15',
        'target_initial_review_date' => '2026-06-15',
        'target_committee_review_date' => '2026-06-22',
        'quality_approval_date' => '2026-06-30 08:00:00',
        'status' => 'for publishing',
        'is_active' => 1,
    ], $attributes));
}

function createPublishingRequest(Batch $batch, array $attributes = []): ApprovalRequest
{
    return ApprovalRequest::query()->create(array_merge([
        'HoldingsID' => 'PUB-'.Str::upper(Str::random(8)),
        'Title' => 'Publishing Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => 4,
        'is_active' => 1,
    ], $attributes));
}

function createPublishingLog(
    ApprovalRequest $approvalRequest,
    User $user,
    int $progressStatus,
    string $remarks = 'Publishing report decision.',
): ApprovalLog {
    return ApprovalLog::query()->forceCreate([
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'batch_id' => $approvalRequest->batch_id,
        'is_approved' => in_array($progressStatus, [2, 4], true),
        'approval_status' => $progressStatus,
        'progress_status' => $progressStatus,
        'remarks' => $remarks,
    ]);
}

test('publishing page renders for authenticated users', function () {
    $user = createPublishingUser();

    $this->actingAs($user)
        ->get('/publishing-page')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('publishing/publishing-page'));
});

test('publishing index returns active batches that require publishing', function () {
    $user = createPublishingUser();
    $publishingBatch = createPublishingBatch([
        'batch_name' => 'Ready Publishing Batch',
    ]);
    createPublishingRequest($publishingBatch);
    createPublishingRequest($publishingBatch);
    createPublishingBatch([
        'batch_name' => 'Published Batch',
        'status' => 'published',
    ]);
    createPublishingBatch([
        'batch_name' => 'Inactive Publishing Batch',
        'is_active' => 0,
    ]);

    $this->actingAs($user)
        ->getJson('/publishing-batches?search=Ready')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.batch_name', 'Ready Publishing Batch')
        ->assertJsonPath('data.0.records_count', 2)
        ->assertJsonPath('analytics.for_publishing', 1)
        ->assertJsonPath('analytics.published', 1)
        ->assertJsonPath('analytics.total_batches', 2);
});

test('publishing action publishes a batch and creates records', function () {
    $user = createPublishingUser();
    $batch = createPublishingBatch([
        'batch_name' => 'Ready To Publish Batch',
    ]);
    $approvalRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-READY-001',
        'Title' => 'Ready Publishing Request',
        'Author' => 'DOST Author',
        'MaterialType' => 'Article',
    ]);

    $this->actingAs($user)
        ->postJson('/publish-batch', ['batchName' => $batch->batch_name])
        ->assertOk()
        ->assertJsonPath('message', 'Batch published successfully.');

    expect($batch->refresh()->status)->toBe('published')
        ->and($batch->published_date)->not->toBeNull()
        ->and($approvalRequest->refresh()->approval_status)->toBe(6);

    $this->assertDatabaseHas('tblrecord', [
        'HoldingsID' => 'PUB-READY-001',
        'Title' => 'Ready Publishing Request',
        'Author' => 'DOST Author',
        'MaterialType' => 'Article',
    ]);
});

test('publishing summary report returns batch workflow counts', function () {
    $user = createPublishingUser();
    $batch = createPublishingBatch([
        'batch_name' => 'Q3 Publishing Report Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'shortlisted_date' => '2026-06-10 08:00:00',
        'status' => 'published',
    ]);
    $publishedRequest = createPublishingRequest($batch, [
        'approval_status' => 6,
    ]);
    $qualityDisapprovedRequest = createPublishingRequest($batch, [
        'approval_status' => 5,
    ]);
    $initialDisapprovedRequest = createPublishingRequest($batch, [
        'approval_status' => 3,
    ]);
    createPublishingBatch([
        'batch_name' => 'Other Quarter Publishing Batch',
        'quarter' => 'Q4',
        'year' => '2026',
        'shortlisted_date' => '2026-06-10 08:00:00',
        'status' => 'published',
    ]);

    createPublishingLog($publishedRequest, $user, 2);
    createPublishingLog($publishedRequest, $user, 4);
    createPublishingLog($qualityDisapprovedRequest, $user, 2);
    createPublishingLog($qualityDisapprovedRequest, $user, 5);
    createPublishingLog($initialDisapprovedRequest, $user, 3);

    $this->actingAs($user)
        ->getJson('/generate-publishing-summary-report?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'batches')
        ->assertJsonPath('batches.0.batch_name', 'Q3 Publishing Report Batch')
        ->assertJsonPath('batches.0.shortlisted_content_count', 3)
        ->assertJsonPath('batches.0.initial_review_approved_count', 2)
        ->assertJsonPath('batches.0.initial_review_disapproved_count', 1)
        ->assertJsonPath('batches.0.quality_approved_count', 1)
        ->assertJsonPath('batches.0.quality_disapproved_count', 1)
        ->assertJsonPath('batches.0.published_content_count', 1);
});

test('publishing reviewer report returns selected reviewer rows', function () {
    $reviewer = createPublishingUser();
    $otherReviewer = createPublishingUser();
    $batch = createPublishingBatch([
        'batch_name' => 'Reviewer Publishing Report Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'for publishing',
    ]);
    $approvalRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-REPORT-001',
        'Title' => 'Reviewer Report Request',
    ]);
    $selectedLog = createPublishingLog(
        $approvalRequest,
        $reviewer,
        5,
        'Needs QA correction.',
    );
    createPublishingLog($approvalRequest, $otherReviewer, 4, 'Other review.');

    LogDetail::query()->forceCreate([
        'approval_status' => 5,
        'approval_request_id' => $approvalRequest->id,
        'content_log_id' => $selectedLog->id,
        'content_reviewer_id' => $reviewer->id,
        'is_passed' => false,
        'description' => 'Completeness',
        'remarks' => 'Completeness',
    ]);

    $this->actingAs($reviewer)
        ->getJson("/generate-publishing-reviewer-report?reviewer_id={$reviewer->id}&quarter=Q3&year=2026")
        ->assertOk()
        ->assertJsonCount(1, 'records')
        ->assertJsonPath('records.0.title', 'Reviewer Report Request')
        ->assertJsonPath('records.0.holdings_id', 'PUB-REPORT-001')
        ->assertJsonPath('records.0.status', 'Quality Assurance - Disapproved')
        ->assertJsonPath('records.0.reason_of_disapproval', 'Completeness')
        ->assertJsonPath('records.0.remarks', 'Needs QA correction.');

    $this->actingAs($reviewer)
        ->getJson('/publishing-report-reviewers')
        ->assertOk()
        ->assertJsonFragment(['full_name' => $reviewer->full_name])
        ->assertJsonFragment(['full_name' => $otherReviewer->full_name]);
});
