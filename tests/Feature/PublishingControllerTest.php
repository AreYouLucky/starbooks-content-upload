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
        $table->dateTime('quality_approval_date')->nullable();
        $table->dateTime('published_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
    });
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

function createPublishingRequest(Batch $batch): ApprovalRequest
{
    return ApprovalRequest::query()->create([
        'HoldingsID' => 'PUB-'.Str::upper(Str::random(8)),
        'Title' => 'Publishing Request '.Str::upper(Str::random(4)),
        'batch_id' => $batch->id,
        'approval_status' => 4,
        'is_active' => 1,
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
