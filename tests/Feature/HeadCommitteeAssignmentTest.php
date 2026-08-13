<?php

use App\Http\Requests\UpdateApprovalRequestAssignmentRequest;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('head committee can validate committee and quality reviewer assignments', function () {
    $request = new UpdateApprovalRequestAssignmentRequest;
    $request->setUserResolver(fn (): User => new User(['role' => 'head_committee']));

    expect($request->authorize())->toBeTrue()
        ->and(array_keys($request->rules()))->toBe([
            'initial_reviewer_id',
            'quality_assurance_reviewer_id',
        ]);
});

test('approval requests expose reviewer assignment relationships', function () {
    $approvalRequest = new ContentRequest;

    expect($approvalRequest->getFillable())
        ->toContain('initial_reviewer_id', 'quality_assurance_reviewer_id')
        ->and($approvalRequest->initialReviewer()->getForeignKeyName())->toBe('initial_reviewer_id')
        ->and($approvalRequest->qualityAssuranceReviewer()->getForeignKeyName())->toBe('quality_assurance_reviewer_id');
});

test('request assignment page returns server paginated and filtered records', function () {
    $headCommittee = User::query()->create([
        'username' => 'head-committee',
        'full_name' => 'Head Committee',
        'delivery_unit' => 'Review Unit',
        'role' => 'head_committee',
        'designation' => 'Head Committee',
        'task_description' => 'Assign reviewers',
        'password' => Hash::make('password'),
    ]);

    $batchId = DB::table('batches')->insertGetId([
        'batch_name' => 'Quarter One Batch',
        'quarter' => 'Q1',
        'year' => '2026',
        'content_source' => 'Test',
        'batch_description' => 'Pagination test batch',
        'target_published_date' => '2026-12-31',
        'target_initial_review_date' => '2026-09-30',
        'is_dost' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach (range(1, 11) as $index) {
        ContentRequest::query()->create([
            'HoldingsID' => 'TEST-'.$index,
            'Title' => 'Request '.$index,
            'approval_status' => 1,
            'batch_id' => $batchId,
        ]);
    }

    $this->actingAs($headCommittee)
        ->get('/view-assignment-designation?quarter=Q1&year=2026')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('head-committee/requests-list')
            ->has('approval_requests.data', 10)
            ->where('approval_requests.total', 11)
            ->where('approval_requests.per_page', 10)
            ->where('filters.quarter', 'Q1')
            ->where('filters.year', '2026')
            ->where('analytics.assigned', 0)
            ->where('analytics.unassigned', 11));

    $this->actingAs($headCommittee)
        ->get('/view-assignment-designation?quarter=Q1&year=2026&unassigned_only=0&page=2')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.unassigned_only', false)
            ->where('approval_requests.current_page', 2)
            ->has('approval_requests.data', 1)
            ->where('approval_requests.prev_page_url', fn ($url) => str_contains($url, 'unassigned_only=0')));
});

test('request assignment page can show only requests not yet assigned', function () {
    $headCommittee = User::query()->create([
        'username' => 'head-filter',
        'full_name' => 'Head Filter',
        'delivery_unit' => 'Review Unit',
        'role' => 'head_committee',
        'designation' => 'Head Committee',
        'task_description' => 'Filter assignments',
        'password' => Hash::make('password'),
    ]);
    $initialReviewer = User::query()->create([
        'username' => 'initial-filter',
        'full_name' => 'Initial Filter',
        'delivery_unit' => 'Review Unit',
        'role' => 'committee',
        'designation' => 'Reviewer',
        'task_description' => 'Initial review',
        'password' => Hash::make('password'),
    ]);
    $qualityReviewer = User::query()->create([
        'username' => 'quality-filter',
        'full_name' => 'Quality Filter',
        'delivery_unit' => 'Review Unit',
        'role' => 'quality',
        'designation' => 'Reviewer',
        'task_description' => 'Quality review',
        'password' => Hash::make('password'),
    ]);
    $batchId = DB::table('batches')->insertGetId([
        'batch_name' => 'Assignment Filter Batch',
        'quarter' => 'Q1',
        'year' => '2026',
        'content_source' => 'Test',
        'batch_description' => 'Assignment filter test batch',
        'target_published_date' => '2026-12-31',
        'target_initial_review_date' => '2026-09-30',
        'is_dost' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    ContentRequest::query()->create([
        'HoldingsID' => 'ASSIGNED-001',
        'Title' => 'Assigned Request',
        'approval_status' => 1,
        'batch_id' => $batchId,
        'initial_reviewer_id' => $initialReviewer->id,
        'quality_assurance_reviewer_id' => $qualityReviewer->id,
    ]);
    ContentRequest::query()->create([
        'HoldingsID' => 'UNASSIGNED-001',
        'Title' => 'Unassigned Request',
        'approval_status' => 1,
        'batch_id' => $batchId,
    ]);

    $this->actingAs($headCommittee)
        ->get('/view-assignment-designation?unassigned_only=1')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.unassigned_only', true)
            ->where('approval_requests.total', 1)
            ->where('approval_requests.data.0.HoldingsID', 'UNASSIGNED-001')
            ->where('analytics.assigned', 1)
            ->where('analytics.unassigned', 1));
});
