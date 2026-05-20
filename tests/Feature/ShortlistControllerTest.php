<?php

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
        $table->string('target_shortlist_date')->nullable();
        $table->string('shortlisted_date')->nullable();
        $table->string('status')->default('for shortlisting');
        $table->boolean('is_active')->default(1);
        $table->boolean('is_dost')->default(1);
        $table->string('start_date')->nullable();
    });
});

function createShortlistUser(): User
{
    return User::query()->create([
        'username' => 'shortlist_'.Str::lower(Str::random(8)),
        'full_name' => 'Shortlist Test '.Str::random(6),
        'delivery_unit' => 'QA',
        'role' => 'stii_admin',
        'designation' => 'Tester',
        'task_description' => 'Shortlist analytics test',
        'password' => Hash::make('password'),
    ]);
}

function createBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Batch '.Str::upper(Str::random(4)),
        'content_source' => 'DOST',
        'batch_description' => 'Analytics test batch',
        'target_shortlist_date' => '2026-05-15',
        'target_initial_review_date' => '2026-05-19',
        'target_committee_review_date' => '2026-05-22',
        'target_published_date' => '2026-05-29',
        'status' => 'for shortlisting',
        'is_active' => 1,
        'quarter' => 'Q2',
        'year' => '2026',
        'is_dost' => 1,
        'start_date' => '2026-05-12',
    ], $attributes));
}

test('shortlist index returns analytics counts for shortlisting and shortlisted batches', function () {
    createBatch([
        'batch_name' => 'Alpha Batch',
        'batch_description' => 'Alpha shortlist work',
        'status' => 'for shortlisting',
    ]);
    createBatch([
        'batch_name' => 'Beta Batch',
        'batch_description' => 'Beta shortlist work',
        'status' => 'for shortlisting',
    ]);
    createBatch([
        'batch_name' => 'Gamma Batch',
        'batch_description' => 'Gamma ready for initial review',
        'status' => 'for initial review',
    ]);
    createBatch([
        'batch_name' => 'Inactive Batch',
        'batch_description' => 'Should be ignored',
        'status' => 'for shortlisting',
        'is_active' => 0,
    ]);

    $user = createShortlistUser();

    $this->actingAs($user)
        ->getJson('/shortlist')
        ->assertOk()
        ->assertJsonPath('analytics.for_shortlisting', 2)
        ->assertJsonPath('analytics.shortlisted', 1);
});

test('shortlist analytics respect the current search filter', function () {
    createBatch([
        'batch_name' => 'Science Batch',
        'batch_description' => 'Filtered shortlist batch',
        'status' => 'for shortlisting',
    ]);
    createBatch([
        'batch_name' => 'Science Review',
        'batch_description' => 'Filtered shortlisted batch',
        'status' => 'for initial review',
    ]);
    createBatch([
        'batch_name' => 'History Batch',
        'batch_description' => 'Should not match the filter',
        'status' => 'for shortlisting',
    ]);

    $user = createShortlistUser();

    $this->actingAs($user)
        ->getJson('/shortlist?search=Science')
        ->assertOk()
        ->assertJsonPath('analytics.for_shortlisting', 1)
        ->assertJsonPath('analytics.shortlisted', 1);
});
