<?php

use App\Models\Batch;
use App\Models\Log;
use App\Models\LogDetail;
use App\Models\Request as ContentRequest;
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
    config()->set('database.connections.starbooks', config('database.connections.sqlite'));
    DB::purge('starbooks');

    if (! Schema::connection('starbooks')->hasTable('tblrecord')) {
        Schema::connection('starbooks')->create('tblrecord', function (Blueprint $table) {
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
            $table->string('BroadClass')->nullable();
            $table->string('AgencyCode')->nullable();
            $table->string('Type')->nullable();
            $table->text('Abstracts')->nullable();
        });
    }
});

function createPublishingUser(array $attributes = []): User
{
    return User::query()->create(array_merge([
        'username' => 'publishing_'.Str::lower(Str::random(8)),
        'full_name' => 'Publishing User '.Str::random(6),
        'delivery_unit' => 'Publishing',
        'role' => 'stii_admin',
        'designation' => 'Publisher',
        'task_description' => 'Publishing test',
        'password' => Hash::make('password'),
    ], $attributes));
}

function createPublishingBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Publishing Batch '.Str::upper(Str::random(4)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Publishing test batch',
        'start_date' => '2026-06-01',
        'shortlisted_date' => '2026-06-10',
        'target_published_date' => '2026-07-15',
        'target_initial_review_date' => '2026-06-15',
        'target_quality_approval_date' => '2026-06-30',
        'initial_reviewed_date' => '2026-06-20 08:00:00',
        'quality_approval_date' => '2026-06-30 08:00:00',
        'status' => 'for publishing',
        'is_active' => 1,
    ], $attributes));
}

function createPublishingRequest(Batch $batch, array $attributes = []): ContentRequest
{
    return ContentRequest::query()->create(array_merge([
        'HoldingsID' => 'PUB-'.Str::upper(Str::random(8)),
        'Title' => 'Publishing Request '.Str::upper(Str::random(4)),
        'Type' => 1,
        'batch_id' => $batch->id,
        'approval_status' => 4,
        'is_active' => 1,
    ], $attributes));
}

function createPublishingLog(
    ContentRequest $approvalRequest,
    User $user,
    int $progressStatus,
    string $remarks = 'Publishing report decision.',
): Log {
    return Log::query()->forceCreate([
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
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

test('publishing index returns filtered content requests and content analytics', function () {
    Carbon::setTestNow('2026-08-24 09:00:00');
    $user = createPublishingUser();
    $publishingBatch = createPublishingBatch([
        'batch_name' => 'Ready Publishing Batch',
        'quarter' => 'Q3',
        'year' => '2026',
    ]);
    createPublishingRequest($publishingBatch, ['Title' => 'Science Ready One']);
    createPublishingRequest($publishingBatch, ['Title' => 'Science Ready Two']);
    createPublishingRequest($publishingBatch, [
        'Title' => 'Science Published While Batch Is Open',
        'approval_status' => 6,
        'published_at' => '2026-08-09 08:00:00',
    ]);

    $publishedBatch = createPublishingBatch([
        'batch_name' => 'Published Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'published',
    ]);
    createPublishingRequest($publishedBatch, [
        'Title' => 'Science Published Content',
        'approval_status' => 6,
        'published_at' => '2026-08-10 08:00:00',
    ]);

    $otherQuarterBatch = createPublishingBatch([
        'batch_name' => 'Other Quarter Published Batch',
        'quarter' => 'Q4',
        'year' => '2026',
        'status' => 'published',
    ]);
    createPublishingRequest($otherQuarterBatch, [
        'Title' => 'Science Other Quarter',
        'approval_status' => 6,
        'published_at' => '2026-08-11 08:00:00',
    ]);

    $inactiveBatch = createPublishingBatch([
        'batch_name' => 'Inactive Publishing Batch',
        'status' => 'published',
        'is_active' => 0,
    ]);
    createPublishingRequest($inactiveBatch, [
        'Title' => 'Science Inactive Content',
        'approval_status' => 6,
        'published_at' => '2026-08-12 08:00:00',
    ]);
    createPublishingRequest($publishingBatch, [
        'Title' => 'Science QA Rejected Content',
        'approval_status' => 5,
    ]);

    $this->actingAs($user)
        ->getJson('/publishing-requests?search=Science&quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(4, 'data')
        ->assertJsonPath('data.0.Title', 'Science Ready One')
        ->assertJsonPath('data.0.batch.batch_name', 'Ready Publishing Batch')
        ->assertJsonPath('analytics.for_publishing', 2)
        ->assertJsonPath('analytics.published', 2)
        ->assertJsonPath('analytics.total_contents', 4)
        ->assertJsonPath('analytics.published_this_quarter', 3)
        ->assertJsonPath('analytics.published_this_year', 3)
        ->assertJsonPath('analytics.current_quarter', 'Q3')
        ->assertJsonPath('analytics.current_year', '2026')
        ->assertJsonPath('quarters', fn ($quarters) => in_array('Q3', $quarters, true))
        ->assertJsonPath('years', fn ($years) => in_array('2026', $years, true));
});

test('publishing action publishes one content request and completes the batch last', function () {
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
    $otherRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-READY-002',
        'Title' => 'Other Ready Publishing Request',
    ]);

    $this->actingAs($user)
        ->postJson("/publish-request/{$approvalRequest->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Content published successfully.');

    expect($batch->refresh()->status)->toBe('for publishing')
        ->and($batch->published_date)->toBeNull()
        ->and($approvalRequest->refresh()->approval_status)->toBe(6)
        ->and($approvalRequest->published_at)->not->toBeNull()
        ->and($otherRequest->refresh()->approval_status)->toBe(4);

    $this->assertDatabaseHas('tblrecord', [
        'HoldingsID' => 'PUB-READY-001',
        'Title' => 'Ready Publishing Request',
        'Author' => 'DOST Author',
        'MaterialType' => 'Article',
    ], 'starbooks');
    $this->assertDatabaseMissing('tblrecord', [
        'HoldingsID' => 'PUB-READY-002',
    ], 'starbooks');

    $this->actingAs($user)
        ->postJson("/publish-request/{$otherRequest->id}")
        ->assertOk();

    expect($batch->refresh()->status)->toBe('published')
        ->and($batch->published_date)->not->toBeNull();

    $this->actingAs($user)
        ->postJson("/publish-request/{$approvalRequest->id}")
        ->assertNotFound();
});

test('publishing summary report returns one row per active content', function () {
    $user = createPublishingUser();
    $batch = createPublishingBatch([
        'batch_name' => 'Q3 Publishing Report Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'shortlisted_date' => '2026-06-10 08:00:00',
        'status' => 'published',
    ]);
    $publishedRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-SUMMARY-001',
        'Title' => 'Published Summary Content',
        'approval_status' => 6,
        'published_at' => '2026-08-10 08:00:00',
    ]);
    $qualityDisapprovedRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-SUMMARY-002',
        'Title' => 'QA Disapproved Summary Content',
        'approval_status' => 5,
    ]);
    $initialDisapprovedRequest = createPublishingRequest($batch, [
        'HoldingsID' => 'PUB-SUMMARY-003',
        'Title' => 'Initial Disapproved Summary Content',
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

    $inactiveRequest = createPublishingRequest($batch, [
        'Title' => 'Inactive Summary Content',
        'is_active' => 0,
    ]);
    createPublishingLog($inactiveRequest, $user, 2);

    $this->actingAs($user)
        ->getJson('/generate-publishing-summary-report?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(3, 'contents')
        ->assertJsonPath('contents.0.title', 'Initial Disapproved Summary Content')
        ->assertJsonPath('contents.0.initial_review_status', 'Disapproved')
        ->assertJsonPath('contents.0.quality_assurance_status', 'Pending')
        ->assertJsonPath('contents.0.publishing_status', 'Not Published')
        ->assertJsonPath('contents.1.title', 'Published Summary Content')
        ->assertJsonPath('contents.1.holdings_id', 'PUB-SUMMARY-001')
        ->assertJsonPath('contents.1.batch_name', 'Q3 Publishing Report Batch')
        ->assertJsonPath('contents.1.initial_review_status', 'Approved')
        ->assertJsonPath('contents.1.quality_assurance_status', 'Approved')
        ->assertJsonPath('contents.1.publishing_status', 'Published')
        ->assertJsonPath('contents.2.title', 'QA Disapproved Summary Content')
        ->assertJsonPath('contents.2.quality_assurance_status', 'Disapproved');
});

test('publishing reviewer report returns selected reviewer rows and lists every reviewer account', function () {
    $admin = createPublishingUser();
    $reviewer = createPublishingUser(['role' => 'quality']);
    $otherReviewer = createPublishingUser();
    $reviewerWithoutLogs = createPublishingUser([
        'full_name' => 'Reviewer Without Logs',
        'role' => 'committee',
    ]);
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
        'request_id' => $approvalRequest->id,
        'log_id' => $selectedLog->id,
        'user_id' => $reviewer->id,
        'is_passed' => false,
        'description' => 'Completeness',
        'remarks' => 'Completeness',
    ]);

    $this->actingAs($admin)
        ->getJson("/generate-publishing-reviewer-report?reviewer_id={$reviewer->id}&quarter=Q3&year=2026")
        ->assertOk()
        ->assertJsonCount(1, 'records')
        ->assertJsonPath('records.0.title', 'Reviewer Report Request')
        ->assertJsonPath('records.0.batch_name', 'Reviewer Publishing Report Batch')
        ->assertJsonPath('records.0.content_source', 'DOST')
        ->assertJsonPath('records.0.holdings_id', 'PUB-REPORT-001')
        ->assertJsonPath('records.0.reviewer_name', $reviewer->full_name)
        ->assertJsonPath('records.0.reviewer_role', 'quality')
        ->assertJsonPath('records.0.status', 'Quality Assurance - Disapproved')
        ->assertJsonPath('records.0.date_forwarded', '2026-06-20 08:00:00')
        ->assertJsonPath('records.0.target_deadline', '2026-06-30')
        ->assertJsonPath('records.0.reason_of_disapproval', 'Completeness')
        ->assertJsonPath('records.0.remarks', 'Needs QA correction.');

    $this->actingAs($admin)
        ->getJson('/publishing-report-reviewers')
        ->assertOk()
        ->assertJsonFragment(['full_name' => $reviewer->full_name, 'role' => 'quality'])
        ->assertJsonFragment(['full_name' => $otherReviewer->full_name, 'role' => 'stii_admin'])
        ->assertJsonFragment(['full_name' => $reviewerWithoutLogs->full_name, 'role' => 'committee']);
});
