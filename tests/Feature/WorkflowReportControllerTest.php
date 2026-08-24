<?php

use App\Models\Batch;
use App\Models\Log;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function workflowReportUser(string $role): User
{
    return User::query()->create([
        'username' => 'report_'.Str::lower(Str::random(10)),
        'full_name' => 'Report User '.Str::random(5),
        'delivery_unit' => 'Reports',
        'role' => $role,
        'designation' => 'Reviewer',
        'task_description' => 'Workflow reporting test',
        'password' => Hash::make('password'),
    ]);
}

function workflowReportBatch(array $attributes = []): Batch
{
    return Batch::query()->forceCreate(array_merge([
        'batch_name' => 'Report Batch '.Str::upper(Str::random(5)),
        'content_source' => 'DOST',
        'batch_description' => 'Report test batch',
        'quarter' => 'Q3',
        'year' => '2026',
        'status' => 'for publishing',
        'is_active' => 1,
        'is_dost' => 0,
        'target_initial_review_date' => '2026-06-20',
        'target_quality_approval_date' => '2026-06-30',
        'target_published_date' => '2026-07-10',
    ], $attributes));
}

function workflowReportContent(Batch $batch, array $attributes = []): ContentRequest
{
    return ContentRequest::query()->create(array_merge([
        'HoldingsID' => 'REPORT-'.Str::upper(Str::random(7)),
        'Title' => 'Report Content '.Str::upper(Str::random(5)),
        'MaterialType' => 'Article',
        'batch_id' => $batch->id,
        'approval_status' => 4,
        'is_active' => 1,
    ], $attributes));
}

function workflowReportLog(
    ContentRequest $content,
    User $reviewer,
    int $progressStatus,
    string $createdAt,
): Log {
    return Log::query()->forceCreate([
        'request_id' => $content->id,
        'user_id' => $reviewer->id,
        'batch_id' => $content->batch_id,
        'is_approved' => in_array($progressStatus, [2, 4], true),
        'approval_status' => $progressStatus,
        'progress_status' => $progressStatus,
        'remarks' => 'Report decision.',
        'created_at' => $createdAt,
        'updated_at' => $createdAt,
    ]);
}

test('report pages enforce each section role matrix', function (string $section, string $role) {
    $this->actingAs(workflowReportUser($role))
        ->get("/reports/{$section}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/report-page')
            ->where('report_section', $section));
})->with([
    'shortlisted stii admin' => ['shortlisted', 'stii_admin'],
    'shortlisted admin' => ['shortlisted', 'admin'],
    'initial reviewer' => ['initial-review', 'committee'],
    'initial admin' => ['initial-review', 'admin'],
    'quality reviewer' => ['quality-assurance', 'quality'],
    'quality admin' => ['quality-assurance', 'admin'],
    'publishing stii admin' => ['publishing', 'stii_admin'],
    'publishing admin' => ['publishing', 'admin'],
    'publishing super admin' => ['publishing', 'super_admin'],
]);

test('report pages reject roles outside the section allowlist', function () {
    $committee = workflowReportUser('committee');

    $this->actingAs($committee)->get('/reports/publishing')->assertForbidden();
    $this->actingAs($committee)->get('/reports/quality-assurance')->assertForbidden();
});

test('report pages require authentication', function () {
    $this->get('/reports/shortlisted')->assertRedirect('/');
    $this->getJson('/reports/publishing/data?quarter=Q3&year=2026')->assertUnauthorized();
});

test('initial review report scopes reviewers and uses assignment date with the first review log', function () {
    $reviewer = workflowReportUser('committee');
    $otherReviewer = workflowReportUser('committee');
    $batch = workflowReportBatch();
    $content = workflowReportContent($batch, [
        'Title' => 'Assigned Initial Content',
        'initial_reviewer_id' => $reviewer->id,
        'initial_reviewed_assigned_date' => '2026-06-01 09:15:00',
    ]);
    workflowReportLog($content, $reviewer, 2, '2026-06-10 08:00:00');
    workflowReportLog($content, $reviewer, 3, '2026-06-11 08:00:00');

    $otherContent = workflowReportContent($batch, [
        'Title' => 'Other Initial Content',
        'initial_reviewer_id' => $otherReviewer->id,
    ]);
    workflowReportLog($otherContent, $otherReviewer, 2, '2026-06-09 08:00:00');

    $this->actingAs($reviewer)
        ->getJson('/reports/initial-review/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.title', 'Assigned Initial Content')
        ->assertJsonPath('rows.0.reviewer_name', $reviewer->full_name)
        ->assertJsonPath('rows.0.date_forwarded', fn ($date) => str_contains($date, '2026-06-01'))
        ->assertJsonPath('rows.0.review_date', fn ($date) => str_contains($date, '2026-06-10'))
        ->assertJsonPath('summary.label', 'Total Average')
        ->assertJsonPath('summary.timeliness', 'BTD')
        ->assertJsonPath('summary.total_score', 5)
        ->assertJsonPath('summary.scored_records', 1)
        ->assertJsonPath('summary.average_score', 5);

    $this->actingAs($reviewer)
        ->getJson("/reports/initial-review/data?quarter=Q3&year=2026&reviewer_id={$otherReviewer->id}")
        ->assertForbidden();
});

test('admin can filter initial review report by the selected reviewer', function () {
    $admin = workflowReportUser('admin');
    $selectedReviewer = workflowReportUser('committee');
    $otherReviewer = workflowReportUser('committee');
    $batch = workflowReportBatch();

    $selectedContent = workflowReportContent($batch, [
        'Title' => 'Selected Reviewer Content',
        'initial_reviewer_id' => $selectedReviewer->id,
    ]);
    workflowReportLog($selectedContent, $selectedReviewer, 2, '2026-06-08 08:00:00');

    $otherContent = workflowReportContent($batch, [
        'Title' => 'Other Reviewer Content',
        'initial_reviewer_id' => $otherReviewer->id,
    ]);
    workflowReportLog($otherContent, $otherReviewer, 2, '2026-06-09 08:00:00');

    $this->actingAs($admin)
        ->getJson("/reports/initial-review/data?quarter=Q3&year=2026&reviewer_id={$selectedReviewer->id}")
        ->assertOk()
        ->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.title', 'Selected Reviewer Content')
        ->assertJsonMissing(['title' => 'Other Reviewer Content']);
});

test('qa report uses dost assignment or first initial approval and always uses the first qa log', function () {
    $reviewer = workflowReportUser('quality');
    $dostBatch = workflowReportBatch(['batch_name' => 'DOST Report Batch', 'is_dost' => 1]);
    $nonDostBatch = workflowReportBatch(['batch_name' => 'Non-DOST Report Batch', 'is_dost' => 0]);

    $dostContent = workflowReportContent($dostBatch, [
        'Title' => 'A DOST QA Content',
        'quality_assurance_reviewer_id' => $reviewer->id,
        'quality_assurance_assigned_date' => '2026-06-03 10:30:00',
    ]);
    workflowReportLog($dostContent, $reviewer, 4, '2026-06-12 08:00:00');
    workflowReportLog($dostContent, $reviewer, 5, '2026-06-13 08:00:00');

    $nonDostContent = workflowReportContent($nonDostBatch, [
        'Title' => 'B Non-DOST QA Content',
        'quality_assurance_reviewer_id' => $reviewer->id,
    ]);
    $initialReviewer = workflowReportUser('committee');
    workflowReportLog($nonDostContent, $initialReviewer, 2, '2026-06-05 07:45:00');
    workflowReportLog($nonDostContent, $reviewer, 4, '2026-06-14 08:00:00');
    workflowReportLog($nonDostContent, $reviewer, 5, '2026-06-15 08:00:00');

    $this->actingAs($reviewer)
        ->getJson('/reports/quality-assurance/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(2, 'rows')
        ->assertJsonPath('rows.0.title', 'A DOST QA Content')
        ->assertJsonPath('rows.0.date_forwarded', fn ($date) => str_contains($date, '2026-06-03'))
        ->assertJsonPath('rows.0.review_date', fn ($date) => str_contains($date, '2026-06-12'))
        ->assertJsonPath('rows.1.title', 'B Non-DOST QA Content')
        ->assertJsonPath('rows.1.date_forwarded', fn ($date) => str_contains($date, '2026-06-05'))
        ->assertJsonPath('rows.1.review_date', fn ($date) => str_contains($date, '2026-06-14'));
});

test('shortlisted report combines partial contents and publishing report includes only published contents', function () {
    $admin = workflowReportUser('admin');
    $partialBatch = workflowReportBatch([
        'batch_name' => 'Partial Batch',
        'status' => 'for shortlisting',
    ]);
    $publishedBatch = workflowReportBatch([
        'batch_name' => 'Published Batch',
        'status' => 'published',
    ]);
    workflowReportContent($partialBatch, ['Title' => 'Partial Content']);
    workflowReportContent($publishedBatch, [
        'Title' => 'Published Content',
        'approval_status' => 6,
        'published_at' => '2026-08-20 08:00:00',
    ]);
    workflowReportContent($publishedBatch, [
        'Title' => 'Unpublished Content',
        'approval_status' => 4,
    ]);

    $this->actingAs($admin)
        ->getJson('/reports/shortlisted/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonFragment(['title' => 'Partial Content']);

    $this->actingAs($admin)
        ->getJson('/reports/publishing/data?quarter=Q3&year=2026')
        ->assertOk()
        ->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.title', 'Published Content')
        ->assertJsonMissing(['title' => 'Unpublished Content']);
});
