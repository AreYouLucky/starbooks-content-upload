<?php

use App\Http\Requests\UpdateApprovalRequestAssignmentRequest;
use App\Models\ApprovalRequest;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

test('head committee can validate committee and quality reviewer assignments', function () {
    $request = new UpdateApprovalRequestAssignmentRequest;
    $request->setUserResolver(fn (): User => new User(['role' => 'head_committee']));

    expect($request->authorize())->toBeTrue()
        ->and(array_keys($request->rules()))->toBe([
            'committee_reviewer_id',
            'quality_assurance_reviewer_id',
        ]);
});

test('approval requests expose reviewer assignment relationships', function () {
    $approvalRequest = new ApprovalRequest;

    expect($approvalRequest->getFillable())
        ->toContain('committee_reviewer_id', 'quality_assurance_reviewer_id')
        ->and($approvalRequest->committeeReviewer()->getForeignKeyName())->toBe('committee_reviewer_id')
        ->and($approvalRequest->qualityAssuranceReviewer()->getForeignKeyName())->toBe('quality_assurance_reviewer_id');
});

test('request assignment page returns server paginated and filtered records', function () {
    Schema::table('content_batches', function (Blueprint $table): void {
        $table->boolean('is_dost')->default(false);
    });

    $headCommittee = User::query()->create([
        'username' => 'head-committee',
        'full_name' => 'Head Committee',
        'delivery_unit' => 'Review Unit',
        'role' => 'head_committee',
        'designation' => 'Head Committee',
        'task_description' => 'Assign reviewers',
        'password' => Hash::make('password'),
    ]);

    $batchId = DB::table('content_batches')->insertGetId([
        'batch_name' => 'Quarter One Batch',
        'quarter' => 'Q1',
        'year' => '2026',
        'content_source' => 'Test',
        'batch_description' => 'Pagination test batch',
        'target_published_date' => '2026-12-31',
        'target_initial_review_date' => '2026-09-30',
        'target_committee_review_date' => '2026-10-31',
        'is_dost' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach (range(1, 11) as $index) {
        ApprovalRequest::query()->create([
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
});
