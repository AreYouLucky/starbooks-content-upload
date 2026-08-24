<?php

use App\Models\Batch;
use App\Models\Log;
use App\Models\LogDetail;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createInitialReviewUser(): User
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

function createInitialReviewBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Batch '.Str::upper(Str::random(4)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'DOST',
        'batch_description' => 'Committee review test batch',
        'target_published_date' => '2026-05-29',
        'target_initial_review_date' => '2026-05-19',
        'status' => 'for initial review',
        'is_active' => 1,
    ], $attributes));
}

function createApprovalRequestForBatch(Batch $batch, int $approvalStatus): ContentRequest
{
    return ContentRequest::query()->create([
        'HoldingsID' => 'HOLD-'.Str::upper(Str::random(8)),
        'Title' => 'Approval Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ]);
}

test('initial review request list filters and paginates requests assigned to the reviewer', function () {
    $reviewer = createInitialReviewUser();
    $otherReviewer = createInitialReviewUser();
    $matchingBatch = createInitialReviewBatch([
        'batch_name' => 'Science Review Batch',
        'quarter' => 'Q3',
        'year' => '2026',
    ]);
    $otherBatch = createInitialReviewBatch([
        'batch_name' => 'Other Review Batch',
        'quarter' => 'Q4',
        'year' => '2026',
    ]);

    foreach (range(1, 11) as $index) {
        createApprovalRequestForBatch($matchingBatch, 1)->update([
            'Title' => "Science Request {$index}",
            'initial_reviewer_id' => $reviewer->id,
        ]);
    }

    createApprovalRequestForBatch($matchingBatch, 2)->update([
        'Title' => 'Science Approved Request',
        'initial_reviewer_id' => $reviewer->id,
    ]);
    createApprovalRequestForBatch($matchingBatch, 1)->update([
        'Title' => 'Science Other Reviewer Request',
        'initial_reviewer_id' => $otherReviewer->id,
    ]);
    createApprovalRequestForBatch($otherBatch, 1)->update([
        'Title' => 'Science Other Quarter Request',
        'initial_reviewer_id' => $reviewer->id,
    ]);

    $this->actingAs($reviewer)
        ->get('/initial-review-page?quarter=Q3&year=2026&search=Science')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('initial-review/requests-list')
            ->has('approval_requests.data', 10)
            ->where('approval_requests.total', 12)
            ->where('approval_requests.per_page', 10)
            ->where('filters.quarter', 'Q3')
            ->where('filters.year', '2026')
            ->where('filters.search', 'Science')
            ->where('analytics.pending', 11)
            ->where('analytics.approved', 1)
            ->where('analytics.disapproved', 0)
            ->where('quarters', ['Q3', 'Q4'])
            ->where('years', ['2026'])
            ->missing('batch')
            ->where('approval_requests.next_page_url', fn ($url) => str_contains($url, 'quarter=Q3')
                && str_contains($url, 'year=2026')
                && str_contains($url, 'search=Science')));

    $this->actingAs($reviewer)
        ->get('/initial-review-page?quarter=Q3&year=2026&search=Science&page=2')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('approval_requests.current_page', 2)
            ->has('approval_requests.data', 2)
            ->where('analytics.pending', 11)
            ->where('analytics.approved', 1));
});

test('initial review index returns approval request status counts per batch', function () {
    $batch = createInitialReviewBatch([
        'batch_name' => 'Science Committee Batch',
    ]);

    createApprovalRequestForBatch($batch, 1);
    createApprovalRequestForBatch($batch, 1);
    createApprovalRequestForBatch($batch, 2);
    createApprovalRequestForBatch($batch, 3);
    createApprovalRequestForBatch($batch, 0);

    createInitialReviewBatch([
        'batch_name' => 'Shortlisting Batch',
        'status' => 'for shortlisting',
    ]);

    $user = createInitialReviewUser();

    $this->actingAs($user)
        ->getJson('/initial-review-batches')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.pending', 2)
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 1);
});

test('initial review index filters batches without changing their request counts', function () {
    $scienceBatch = createInitialReviewBatch([
        'batch_name' => 'Science Committee Batch',
        'batch_description' => 'Filtered committee work',
    ]);
    $historyBatch = createInitialReviewBatch([
        'batch_name' => 'History Committee Batch',
        'batch_description' => 'Should not match',
    ]);

    createApprovalRequestForBatch($scienceBatch, 2);
    createApprovalRequestForBatch($historyBatch, 3);

    $user = createInitialReviewUser();

    $this->actingAs($user)
        ->getJson('/initial-review-batches?search=Science')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.batch_name', 'Science Committee Batch')
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 0);
});

test('initial review index includes reviewed batches after unreviewed batches', function () {
    $reviewedBatch = createInitialReviewBatch([
        'batch_name' => 'Already Reviewed Committee Batch',
        'status' => 'for quality approval',
        'initial_reviewed_date' => '2026-06-20 08:00:00',
        'created_at' => now(),
    ]);
    $unreviewedBatch = createInitialReviewBatch([
        'batch_name' => 'Current Committee Batch',
        'status' => 'for initial review',
        'created_at' => now()->subDay(),
    ]);
    createApprovalRequestForBatch($reviewedBatch, 2);
    createApprovalRequestForBatch($unreviewedBatch, 1);
    createInitialReviewBatch([
        'batch_name' => 'Shortlisting Batch',
        'status' => 'for shortlisting',
    ]);
    $user = createInitialReviewUser();

    $this->actingAs($user)
        ->getJson('/initial-review-batches')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.batch_name', 'Current Committee Batch')
        ->assertJsonPath('data.1.batch_name', 'Already Reviewed Committee Batch')
        ->assertJsonPath('analytics.for_initial_review', 1)
        ->assertJsonPath('analytics.reviewed', 1);
});

test('initial review report returns only content assigned to the reviewer', function () {
    $batch = createInitialReviewBatch([
        'batch_name' => 'Reviewed Committee Batch',
        'quarter' => 'Q3',
        'status' => 'for quality approval',
        'year' => '2026',
    ]);
    $reviewedRequest = createApprovalRequestForBatch($batch, 1);
    $unreviewedRequest = createApprovalRequestForBatch($batch, 2);
    createInitialReviewBatch([
        'batch_name' => 'Different Quarter Batch',
        'quarter' => 'Q4',
        'status' => 'for quality approval',
        'year' => '2026',
    ]);
    $batchWithoutReviewedLogs = createInitialReviewBatch([
        'batch_name' => 'No Reviewed Logs Batch',
        'quarter' => 'Q3',
        'status' => 'for quality approval',
        'year' => '2026',
    ]);
    createApprovalRequestForBatch($batchWithoutReviewedLogs, 2);
    $user = createInitialReviewUser();
    $reviewedRequest->update([
        'initial_reviewer_id' => $user->id,
        'initial_reviewed_assigned_date' => '2026-06-01 08:00:00',
    ]);

    $approvalLog = Log::query()->create([
        'request_id' => $reviewedRequest->id,
        'user_id' => $user->id,
        'batch_id' => $batch->id,
        'is_approved' => true,
        'progress_status' => 2,
        'remarks' => 'Approved by the committee.',
    ]);

    Log::query()->create([
        'request_id' => $unreviewedRequest->id,
        'user_id' => $user->id,
        'batch_id' => $batch->id,
        'is_approved' => false,
        'progress_status' => 1,
        'remarks' => 'Still awaiting initial review.',
    ]);

    LogDetail::query()->forceCreate([
        'approval_status' => 2,
        'request_id' => $reviewedRequest->id,
        'log_id' => $approvalLog->id,
        'user_id' => $user->id,
        'is_passed' => true,
        'description' => 'Accuracy',
        'remarks' => 'Passed.',
    ]);

    $this->actingAs($user)
        ->getJson('/reports/initial-review/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.title', $reviewedRequest->Title)
        ->assertJsonPath('rows.0.reviewer_name', $user->full_name)
        ->assertJsonPath('rows.0.date_forwarded', fn ($date) => str_contains($date, '2026-06-01'));
});

test('initial review submission updates request and stores disapproval reasons', function () {
    $batch = createInitialReviewBatch();
    $approvalRequest = createApprovalRequestForBatch($batch, 1);
    $user = createInitialReviewUser();

    $this->actingAs($user)
        ->postJson('/submit-initial-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'disapproval_reasons' => ['Accuracy', 'Recency'],
            'remarks' => 'Needs corrections before approval.',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Review successfully saved.');

    $approvalRequest->refresh();
    expect($approvalRequest->approval_status)->toBe(3)
        ->and($approvalRequest->initial_reviewed_date?->toDateString())->toBe(Carbon::today()->toDateString());

    $logId = DB::table('logs')->value('id');

    $this->assertDatabaseHas('logs', [
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
        'batch_id' => $batch->id,
        'is_approved' => false,
        'approval_status' => 3,
        'remarks' => 'Needs corrections before approval.',
    ]);

    $this->assertDatabaseHas('log_details', [
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
        'log_id' => $logId,
        'approval_status' => 3,
        'description' => 'Accuracy',
        'remarks' => 'Accuracy',
    ]);
});

test('initial review submission requires reasons when disapproved', function () {
    $batch = createInitialReviewBatch();
    $approvalRequest = createApprovalRequestForBatch($batch, 1);
    $user = createInitialReviewUser();

    $this->actingAs($user)
        ->postJson('/submit-initial-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'disapproved',
            'remarks' => 'Needs corrections before approval.',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['disapproval_reasons']);

    $approvalRequest->refresh();
    expect($approvalRequest->approval_status)->toBe(1);
});

test('forwarding to quality assurance keeps approved requests pending for the quality stage', function () {
    $batch = createInitialReviewBatch(['batch_name' => 'Ready for QA Batch']);
    $approvedRequest = createApprovalRequestForBatch($batch, 2);
    $disapprovedRequest = createApprovalRequestForBatch($batch, 3);
    $user = createInitialReviewUser();
    $user->update(['role' => 'stii_admin']);

    $this->actingAs($user)
        ->postJson('/forward-to-quality-assurance', ['batchName' => $batch->batch_name])
        ->assertOk();

    expect($batch->refresh()->status)->toBe('for quality approval')
        ->and($approvedRequest->refresh()->approval_status)->toBe(2)
        ->and($disapprovedRequest->refresh()->approval_status)->toBe(3);
});
