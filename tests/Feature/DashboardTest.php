<?php

use App\Models\Batch;
use App\Models\Log;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

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

function createDashboardRequest(Batch $batch, int $approvalStatus, array $attributes = []): ContentRequest
{
    return ContentRequest::query()->create(array_merge([
        'HoldingsID' => 'DASH-'.fake()->unique()->bothify('????####'),
        'Title' => 'Dashboard Request '.fake()->unique()->word(),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ], $attributes));
}

function createDashboardLog(
    ContentRequest $approvalRequest,
    User $user,
    int $progressStatus,
): Log {
    return Log::query()->forceCreate([
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
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

test('dashboard data includes late content awaiting review by urgency', function () {
    $this->travelTo(Carbon::parse('2026-08-13'));

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
        'target_published_date' => '2026-08-14',
    ]);

    createDashboardRequest($lateInitialReviewBatch, 1, [
        'HoldingsID' => 'URGENT-INITIAL',
        'Title' => 'Late Initial Review Content',
    ]);
    createDashboardRequest($lateInitialReviewBatch, 1, [
        'HoldingsID' => 'URGENT-INITIAL-SECOND',
        'Title' => 'Second Late Initial Content',
    ]);
    createDashboardRequest($lateInitialReviewBatch, 2, [
        'Title' => 'Completed Initial Review Content',
    ]);
    createDashboardRequest($lateQualityBatch, 2, [
        'HoldingsID' => 'URGENT-QA',
        'Title' => 'Late Quality Content',
    ]);

    $this->actingAs($user)
        ->getJson('/dashboard-data?scope=all')
        ->assertOk()
        ->assertJsonPath('urgent_contents.0.title', 'Late Initial Review Content')
        ->assertJsonPath('urgent_contents.0.batch_name', 'Late Initial Review Batch')
        ->assertJsonPath('urgent_contents.0.stage', 'Initial Review')
        ->assertJsonPath('urgent_contents.1.title', 'Second Late Initial Content')
        ->assertJsonPath('urgent_contents.2.title', 'Late Quality Content')
        ->assertJsonPath('urgent_contents.2.batch_name', 'Late Quality Batch')
        ->assertJsonPath('urgent_contents.2.stage', 'Quality Assurance')
        ->assertJsonMissing(['title' => 'Completed Initial Review Content'])
        ->assertJsonCount(3, 'urgent_contents');
});
