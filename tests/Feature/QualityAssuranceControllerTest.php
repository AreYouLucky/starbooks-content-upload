<?php

use App\Models\Batch;
use App\Models\Log;
use App\Models\LogDetail;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createQualityUser(array $attributes = []): User
{
    return User::query()->create(array_merge([
        'username' => 'quality_'.Str::lower(Str::random(8)),
        'full_name' => 'Quality Reviewer '.Str::random(6),
        'delivery_unit' => 'QA',
        'role' => 'quality',
        'designation' => 'Reviewer',
        'task_description' => 'Quality assurance test',
        'password' => Hash::make('password'),
    ], $attributes));
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
        'target_quality_approval_date' => '2026-06-29',
        'status' => 'for quality approval',
        'is_active' => 1,
    ], $attributes));
}

function createQualityRequest(Batch $batch, int $approvalStatus): ContentRequest
{
    return ContentRequest::query()->create([
        'HoldingsID' => 'QA-'.Str::upper(Str::random(8)),
        'Title' => 'Quality Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => $approvalStatus,
        'is_active' => 1,
    ]);
}

function createQualityLog(
    ContentRequest $approvalRequest,
    User $user,
    int $progressStatus,
): Log {
    return Log::query()->forceCreate([
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
        'batch_id' => $approvalRequest->batch_id,
        'is_approved' => $progressStatus === 4,
        'approval_status' => $progressStatus === 4 ? 2 : 3,
        'progress_status' => $progressStatus,
        'remarks' => 'Quality assurance decision.',
    ]);
}

function qualityRejectedUpdatePayload(ContentRequest $approvalRequest): array
{
    return [
        'Title' => 'Corrected QA Rejected Title',
        'Author' => 'Corrected Author',
        'HoldingsID' => $approvalRequest->HoldingsID,
        'Contents' => 'SCI',
        'MaterialType' => 'Article',
        'JournalTitle' => 'Corrected Journal',
        'Subject' => 'Corrected Subject',
        'SubTitle' => 'Corrected Subtitle',
        'VolumeNo' => '12',
        'IssueNo' => '3',
        'IssueDate' => '2026',
        'BroadClass' => 'Science',
        'AgencyCode' => 'STII',
        'Type' => '1',
        'batch_id' => $approvalRequest->batch_id,
        'Abstracts' => '<p>Corrected abstract.</p>',
    ];
}

test('quality assurance request list filters and paginates requests assigned to the reviewer', function () {
    $reviewer = createQualityUser();
    $otherReviewer = createQualityUser();
    $matchingBatch = createQualityBatch([
        'batch_name' => 'Science QA Batch',
        'quarter' => 'Q3',
        'year' => '2026',
    ]);
    $otherBatch = createQualityBatch([
        'batch_name' => 'Other QA Batch',
        'quarter' => 'Q4',
        'year' => '2026',
    ]);

    foreach (range(1, 11) as $index) {
        createQualityRequest($matchingBatch, 2)->update([
            'Title' => "Science Request {$index}",
            'quality_assurance_reviewer_id' => $reviewer->id,
        ]);
    }

    createQualityRequest($matchingBatch, 4)->update([
        'Title' => 'Science Approved Request',
        'quality_assurance_reviewer_id' => $reviewer->id,
    ]);
    createQualityRequest($matchingBatch, 2)->update([
        'Title' => 'Science Other Reviewer Request',
        'quality_assurance_reviewer_id' => $otherReviewer->id,
    ]);
    createQualityRequest($otherBatch, 5)->update([
        'Title' => 'Science Other Quarter Request',
        'quality_assurance_reviewer_id' => $reviewer->id,
    ]);
    createQualityRequest($matchingBatch, 3)->update([
        'Title' => 'Science Initial Review Rejected Request',
        'quality_assurance_reviewer_id' => $reviewer->id,
    ]);

    $this->actingAs($reviewer)
        ->get('/quality-assurance-page?quarter=Q3&year=2026&search=Science')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quality-assurance/requests-list')
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
        ->get('/quality-assurance-page?quarter=Q3&year=2026&search=Science&page=2')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('approval_requests.current_page', 2)
            ->has('approval_requests.data', 2)
            ->where('analytics.pending', 11)
            ->where('analytics.approved', 1));
});

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

test('legacy quality assurance batch route redirects to the all requests list', function () {
    createQualityBatch(['batch_name' => 'Filtered QA Batch']);
    $user = createQualityUser();

    $this->actingAs($user)
        ->get('/view-quality-assurance-batch/Filtered%20QA%20Batch')
        ->assertRedirect('/quality-assurance-page');
});

test('quality assurance submission stores a separate quality-stage decision', function () {
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 2);
    $user = createQualityUser();
    $approvalRequest->update([
        'quality_assurance_reviewer_id' => $user->id,
    ]);

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

    $this->assertDatabaseHas('logs', [
        'request_id' => $approvalRequest->id,
        'user_id' => $user->id,
        'progress_status' => 5,
        'approval_status' => 5,
        'remarks' => 'Quality corrections are required.',
    ]);
    $this->assertDatabaseHas('log_details', [
        'request_id' => $approvalRequest->id,
        'approval_status' => 5,
        'description' => 'Completeness',
        'remarks' => 'Completeness',
    ]);
});

test('quality reviewer cannot review a request assigned to another reviewer', function () {
    $batch = createQualityBatch();
    $assignedReviewer = createQualityUser();
    $otherReviewer = createQualityUser();
    $approvalRequest = createQualityRequest($batch, 2);
    $approvalRequest->update([
        'quality_assurance_reviewer_id' => $assignedReviewer->id,
    ]);

    $this->actingAs($otherReviewer)
        ->get('/quality-assurance-request/'.$approvalRequest->HoldingsID)
        ->assertNotFound();

    $this->actingAs($otherReviewer)
        ->postJson('/submit-quality-assurance-review', [
            'holdings_id' => $approvalRequest->HoldingsID,
            'review_decision' => 'approved',
            'remarks' => '',
        ])
        ->assertNotFound();

    expect($approvalRequest->refresh()->approval_status)->toBe(2);
});

test('quality assurance disapproval requires remarks', function () {
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 2);
    $user = createQualityUser();
    $approvalRequest->update([
        'quality_assurance_reviewer_id' => $user->id,
    ]);

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
    $user->update(['role' => 'stii_admin']);

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

test('quality assurance report returns only content assigned to the reviewer', function () {
    $batch = createQualityBatch([
        'batch_name' => 'Reported QA Batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'for publishing',
        'is_dost' => 1,
    ]);
    $approvalRequest = createQualityRequest($batch, 4);
    $user = createQualityUser();
    $approvalRequest->update([
        'quality_assurance_reviewer_id' => $user->id,
        'quality_assurance_assigned_date' => '2026-06-21 08:00:00',
    ]);

    createQualityLog($approvalRequest, $user, 2);
    $qualityLog = createQualityLog($approvalRequest, $user, 4);

    LogDetail::query()->forceCreate([
        'approval_status' => 4,
        'request_id' => $approvalRequest->id,
        'log_id' => $qualityLog->id,
        'user_id' => $user->id,
        'is_passed' => true,
        'description' => 'Quality',
        'remarks' => 'Passed quality assurance.',
    ]);

    $this->actingAs($user)
        ->getJson('/reports/quality-assurance/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.title', $approvalRequest->Title)
        ->assertJsonPath('rows.0.reviewer_name', $user->full_name)
        ->assertJsonPath('rows.0.date_forwarded', fn ($date) => str_contains($date, '2026-06-21'));
});

test('qa rejected list mirrors reviewer filters and server pagination', function () {
    $admin = createQualityUser(['role' => 'stii_admin']);
    $reviewer = createQualityUser();
    $otherReviewer = createQualityUser();
    $matchingBatch = createQualityBatch([
        'batch_name' => 'Rejected Science Batch',
        'quarter' => 'Q3',
        'year' => '2026',
    ]);
    $otherBatch = createQualityBatch([
        'batch_name' => 'Rejected Other Batch',
        'quarter' => 'Q4',
        'year' => '2026',
    ]);

    foreach (range(1, 11) as $index) {
        $approvalRequest = createQualityRequest($matchingBatch, 5);
        $approvalRequest->update([
            'Title' => "Rejected Science Request {$index}",
            'quality_assurance_reviewer_id' => $reviewer->id,
        ]);
        createQualityLog($approvalRequest, $reviewer, 5);
    }

    $otherReviewerRequest = createQualityRequest($matchingBatch, 5);
    $otherReviewerRequest->update([
        'Title' => 'Rejected Science Other Reviewer',
        'quality_assurance_reviewer_id' => $otherReviewer->id,
    ]);
    createQualityLog($otherReviewerRequest, $otherReviewer, 5);

    $otherQuarterRequest = createQualityRequest($otherBatch, 5);
    $otherQuarterRequest->update([
        'Title' => 'Rejected Science Other Quarter',
        'quality_assurance_reviewer_id' => $reviewer->id,
    ]);
    createQualityLog($otherQuarterRequest, $reviewer, 5);

    $this->actingAs($admin)
        ->get('/quality-assurance-rejected?quarter=Q3&year=2026&search=Science&page=2')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('qa-rejected/rejected-requests-list')
            ->where('approval_requests.current_page', 2)
            ->where('approval_requests.total', 12)
            ->has('approval_requests.data', 2)
            ->where('filters.quarter', 'Q3')
            ->where('filters.year', '2026')
            ->where('filters.search', 'Science')
            ->where('quarters', ['Q3', 'Q4'])
            ->where('years', ['2026'])
            ->where('approval_requests.next_page_url', null)
            ->where('approval_requests.prev_page_url', fn ($url) => str_contains($url, 'quarter=Q3')
                && str_contains($url, 'year=2026')
                && str_contains($url, 'search=Science')));
});

test('qa rejected list includes the latest rejection remarks and log details', function () {
    $admin = createQualityUser(['role' => 'stii_admin']);
    $reviewer = createQualityUser();
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 5);
    $olderLog = createQualityLog($approvalRequest, $reviewer, 5);
    $olderLog->update(['remarks' => 'Older rejection remarks.']);
    $latestLog = createQualityLog($approvalRequest, $reviewer, 5);
    $latestLog->update(['remarks' => 'Please correct the incomplete metadata.']);

    LogDetail::query()->forceCreate([
        'approval_status' => 5,
        'request_id' => $approvalRequest->id,
        'log_id' => $latestLog->id,
        'user_id' => $reviewer->id,
        'is_passed' => false,
        'description' => 'Completeness',
        'remarks' => 'Completeness',
    ]);

    $this->actingAs($admin)
        ->get('/quality-assurance-rejected')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('qa-rejected/rejected-requests-list')
            ->has('approval_requests.data.0.approval_logs', 1)
            ->where('approval_requests.data.0.approval_logs.0.id', $latestLog->id)
            ->where(
                'approval_requests.data.0.approval_logs.0.remarks',
                'Please correct the incomplete metadata.'
            )
            ->where(
                'approval_requests.data.0.approval_logs.0.log_details.0.description',
                'Completeness'
            )
            ->has('approval_requests.data.0.approval_logs.0.log_details', 1));
});

test('qa rejected request can be edited without changing request or log status', function () {
    $admin = createQualityUser(['role' => 'admin']);
    $reviewer = createQualityUser();
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 5);
    $approvalRequest->update(['quality_assurance_reviewer_id' => $reviewer->id]);
    $log = createQualityLog($approvalRequest, $reviewer, 5);

    $this->actingAs($admin)
        ->get("/quality-assurance-rejected/{$approvalRequest->id}/edit")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shortlisted/partials/single-upload-form')
            ->where('approval_request.id', $approvalRequest->id)
            ->where('update_url', "/quality-assurance-rejected/{$approvalRequest->id}")
            ->where('form_title', 'Edit QA Rejected Request')
            ->where('form_breadcrumbs.1.title', 'QA Rejected'));

    $payload = [
        ...qualityRejectedUpdatePayload($approvalRequest),
        'approval_status' => 4,
        'progress_status' => 4,
    ];

    $this->actingAs($admin)
        ->postJson("/quality-assurance-rejected/{$approvalRequest->id}", $payload)
        ->assertOk()
        ->assertJsonPath('status', 'QA rejected request successfully updated.');

    expect($approvalRequest->refresh()->Title)->toBe('Corrected QA Rejected Title')
        ->and($approvalRequest->approval_status)->toBe(5)
        ->and($log->refresh()->progress_status)->toBe(5);
});

test('qa rejected endpoints deny quality reviewers and retain rejected state checks', function () {
    $admin = createQualityUser(['role' => 'super_admin']);
    $assignedReviewer = createQualityUser();
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 5);
    $approvalRequest->update(['quality_assurance_reviewer_id' => $assignedReviewer->id]);
    createQualityLog($approvalRequest, $assignedReviewer, 5);

    $this->actingAs($assignedReviewer)
        ->get('/quality-assurance-rejected')
        ->assertForbidden();

    $this->actingAs($assignedReviewer)
        ->get("/quality-assurance-rejected/{$approvalRequest->id}/edit")
        ->assertForbidden();

    $this->actingAs($assignedReviewer)
        ->postJson(
            "/quality-assurance-rejected/{$approvalRequest->id}",
            qualityRejectedUpdatePayload($approvalRequest),
        )
        ->assertForbidden();

    $this->actingAs($assignedReviewer)
        ->postJson("/quality-assurance-rejected/{$approvalRequest->id}/forward")
        ->assertForbidden();

    $approvalRequest->update(['approval_status' => 4]);

    $this->actingAs($admin)
        ->postJson("/quality-assurance-rejected/{$approvalRequest->id}/forward")
        ->assertNotFound();
});

test('forwarding a qa rejected request returns the request and log to quality assurance', function () {
    $admin = createQualityUser(['role' => 'stii_admin']);
    $reviewer = createQualityUser();
    $batch = createQualityBatch();
    $approvalRequest = createQualityRequest($batch, 5);
    $approvalRequest->update([
        'quality_assurance_reviewer_id' => $reviewer->id,
        'Title' => 'Rejected title remains unchanged',
    ]);
    $log = createQualityLog($approvalRequest, $reviewer, 5);
    $requestAttributes = collect($approvalRequest->fresh()->getAttributes())
        ->except(['approval_status', 'updated_at'])
        ->all();
    $logAttributes = $log->fresh()->only([
        'request_id',
        'user_id',
        'batch_id',
        'is_approved',
        'approval_status',
        'remarks',
    ]);

    $this->actingAs($admin)
        ->postJson("/quality-assurance-rejected/{$approvalRequest->id}/forward")
        ->assertOk()
        ->assertJsonPath('message', 'Request successfully forwarded to Quality Assurance.');

    expect($approvalRequest->refresh()->approval_status)->toBe(4)
        ->and(collect($approvalRequest->getAttributes())->except(['approval_status', 'updated_at'])->all())->toBe($requestAttributes)
        ->and($log->refresh()->progress_status)->toBe(4)
        ->and($log->only(array_keys($logAttributes)))->toBe($logAttributes);
});

test('qa rejected page is accessible to authorized admin roles', function (string $role) {
    $user = createQualityUser(['role' => $role]);

    $this->actingAs($user)
        ->get('/quality-assurance-rejected')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('qa-rejected/rejected-requests-list'));
})->with(['stii admin' => 'stii_admin', 'super admin' => 'super_admin', 'admin' => 'admin']);

test('qa rejected page rejects unauthorized roles', function (string $role) {
    $user = createQualityUser(['role' => $role]);

    $this->actingAs($user)
        ->get('/quality-assurance-rejected')
        ->assertForbidden();
})->with([
    'quality reviewer' => 'quality',
    'committee reviewer' => 'committee',
    'head committee' => 'head_committee',
]);

test('qa rejected page requires authentication', function () {
    $this->get('/quality-assurance-rejected')->assertRedirect('/');
});
