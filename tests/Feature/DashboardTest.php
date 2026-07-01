<?php

use App\Models\ApprovalLog;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function () {
    Schema::table('content_batches', function (Blueprint $table) {
        $table->string('target_shortlist_date')->nullable();
        $table->string('target_quality_approval_date')->nullable();
        $table->dateTime('shortlisted_date')->nullable();
        $table->dateTime('published_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
    });

    Schema::table('content_approval_logs', function (Blueprint $table) {
        $table->integer('progress_status')->default(0);
    });
});

function createDashboardBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Dashboard Batch '.fake()->unique()->bothify('??##'),
        'quarter' => 'Q3',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Dashboard test batch',
        'target_shortlist_date' => '2026-06-01',
        'target_published_date' => '2026-07-15',
        'target_initial_review_date' => '2026-06-15',
        'target_quality_approval_date' => '2026-06-25',
        'target_committee_review_date' => '2026-06-22',
        'status' => 'for publishing',
        'is_active' => 1,
    ], $attributes));
}

function createDashboardUser(): User
{
    return User::query()->create([
        'username' => 'dashboard_'.fake()->unique()->bothify('????####'),
        'full_name' => 'Dashboard User '.fake()->unique()->bothify('????####'),
        'delivery_unit' => 'STII',
        'role' => 'stii_admin',
        'designation' => 'Dashboard Tester',
        'task_description' => 'Dashboard testing',
        'password' => Hash::make('password'),
    ]);
}

function createDashboardRequest(Batch $batch, int $approvalStatus): ApprovalRequest
{
    return ApprovalRequest::query()->create([
        'HoldingsID' => 'DASH-'.fake()->unique()->bothify('????####'),
        'Title' => 'Dashboard Request '.fake()->unique()->word(),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ]);
}

function createDashboardLog(
    ApprovalRequest $approvalRequest,
    User $user,
    int $progressStatus,
): ApprovalLog {
    return ApprovalLog::query()->forceCreate([
        'approval_request_id' => $approvalRequest->id,
        'content_reviewer_id' => $user->id,
        'batch_id' => $approvalRequest->batch_id,
        'is_approved' => in_array($progressStatus, [2, 4], true),
        'approval_status' => $progressStatus,
        'progress_status' => $progressStatus,
        'remarks' => 'Dashboard review log.',
    ]);
}

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect('/');
});

test('authenticated users can visit the dashboard', function () {
    $user = createDashboardUser();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard data returns all scope workflow counts', function () {
    $user = createDashboardUser();
    $batch = createDashboardBatch([
        'batch_name' => 'All Scope Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'published',
        'content_source' => 'DOST-SEI',
    ]);
    $publishedRequest = createDashboardRequest($batch, 6);
    $qualityDisapprovedRequest = createDashboardRequest($batch, 5);
    $otherBatch = createDashboardBatch([
        'batch_name' => 'Other Scope Batch',
        'quarter' => 'Q4',
        'year' => '2026',
        'status' => 'for initial review',
        'content_source' => 'PCAARRD',
    ]);
    createDashboardRequest($otherBatch, 1);

    createDashboardLog($publishedRequest, $user, 2);
    createDashboardLog($publishedRequest, $user, 4);
    createDashboardLog($qualityDisapprovedRequest, $user, 2);
    createDashboardLog($qualityDisapprovedRequest, $user, 5);

    $this->actingAs($user)
        ->getJson('/dashboard-data?scope=all')
        ->assertOk()
        ->assertJsonPath('summary.batches', 2)
        ->assertJsonPath('summary.records', 3)
        ->assertJsonPath('summary.shortlisted', 3)
        ->assertJsonPath('summary.initial_reviewed', 2)
        ->assertJsonPath('summary.quality_reviewed', 2)
        ->assertJsonPath('summary.published', 1)
        ->assertJsonFragment(['name' => 'DOST-SEI', 'value' => 1])
        ->assertJsonFragment(['period' => 'Q3 2026']);
});

test('dashboard data filters by quarter and year', function () {
    $user = createDashboardUser();
    $targetBatch = createDashboardBatch([
        'batch_name' => 'Filtered Dashboard Batch',
        'quarter' => 'Q1',
        'year' => '2026',
        'status' => 'published',
    ]);
    $outsideBatch = createDashboardBatch([
        'batch_name' => 'Outside Dashboard Batch',
        'quarter' => 'Q2',
        'year' => '2026',
    ]);

    createDashboardRequest($targetBatch, 6);
    createDashboardRequest($outsideBatch, 6);

    $this->actingAs($user)
        ->getJson('/dashboard-data?scope=filtered&quarter=Q1&year=2026')
        ->assertOk()
        ->assertJsonPath('summary.batches', 1)
        ->assertJsonPath('summary.records', 1)
        ->assertJsonPath('summary.published', 1)
        ->assertJsonPath('recent_batches.0.batch_name', 'Filtered Dashboard Batch')
        ->assertJsonMissing(['batch_name' => 'Outside Dashboard Batch']);
});

test('dashboard data includes late review batches by urgency', function () {
    $user = createDashboardUser();
    $lateInitialReviewBatch = createDashboardBatch([
        'batch_name' => 'Late Initial Review Batch',
        'status' => 'for initial review',
        'target_initial_review_date' => '2026-06-01',
    ]);
    $lateQualityBatch = createDashboardBatch([
        'batch_name' => 'Late Quality Batch',
        'status' => 'for quality approval',
        'target_quality_approval_date' => '2026-06-20',
    ]);
    createDashboardBatch([
        'batch_name' => 'Healthy Publishing Batch',
        'status' => 'for publishing',
        'target_published_date' => '2026-08-01',
    ]);

    createDashboardRequest($lateInitialReviewBatch, 1);
    createDashboardRequest($lateQualityBatch, 2);

    $this->actingAs($user)
        ->getJson('/dashboard-data?scope=all')
        ->assertOk()
        ->assertJsonPath('urgent_batches.0.batch_name', 'Late Initial Review Batch')
        ->assertJsonPath('urgent_batches.0.stage', 'Initial Review')
        ->assertJsonPath('urgent_batches.1.batch_name', 'Late Quality Batch')
        ->assertJsonPath('urgent_batches.1.stage', 'Quality Assurance')
        ->assertJsonCount(2, 'urgent_batches');
});
