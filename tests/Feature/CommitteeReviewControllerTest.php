<?php

use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        ->getJson('/committee-review')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.pending', 2)
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 1)
        ->assertJsonPath('data.0.reviewed', 2);
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
        ->getJson('/committee-review?search=Science')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.batch_name', 'Science Committee Batch')
        ->assertJsonPath('data.0.approved', 1)
        ->assertJsonPath('data.0.rejected', 0);
});
