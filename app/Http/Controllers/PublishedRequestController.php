<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\Record;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublishedRequestController extends Controller
{
    public function publishingPage(): Response
    {
        return Inertia::render('publishing/publishing-page');
    }

    public function publishingBatches(Request $request): JsonResponse
    {
        $query = Batch::query()
            ->select([
                'id',
                'batch_name',
                'content_source',
                'batch_description',
                'target_published_date',
                'quality_approval_date',
                'published_date',
                'status',
            ])
            ->where('is_active', 1)
            ->where('status', 'for publishing')
            ->orWhere('status', 'published')
            ->withCount([
                'approvalRequests as records_count',
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('batch_name', 'like', '%'.$search.'%')
                    ->orWhere('batch_description', 'like', '%'.$search.'%')
                    ->orWhere('content_source', 'like', '%'.$search.'%');
            });
        }

        $readyForPublishingCount = (clone $query)->count();
        $publishedCount = Batch::query()
            ->where('is_active', 1)
            ->where('status', 'published')
            ->count();

        $analytics = [
            'for_publishing' => $readyForPublishingCount,
            'published' => $publishedCount,
            'total_batches' => $readyForPublishingCount + $publishedCount,
        ];

        $paginatedBatches = $query->latest()->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    public function publishBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batchName' => ['required', 'string', 'max:255'],
        ]);

        $batch = Batch::query()
            ->where('batch_name', $validated['batchName'])
            ->where('status', 'for publishing')
            ->firstOrFail();

        DB::transaction(function () use ($batch): void {
            $batch->update([
                'status' => 'published',
                'published_date' => now(),
            ]);

            $requests = ApprovalRequest::query()
                ->where('batch_id', $batch->id)
                ->get();

            foreach ($requests as $approvalRequest) {
                $approvalRequest->update(['approval_status' => 6]);

                Record::query()->create([
                    'Title' => $approvalRequest->Title ?? '',
                    'Author' => $approvalRequest->Author ?? '',
                    'HoldingsID' => $approvalRequest->HoldingsID ?? '',
                    'Contents' => $approvalRequest->Contents ?? '',
                    'MaterialType' => $approvalRequest->MaterialType ?? '',
                    'JournalTitle' => $approvalRequest->JournalTitle ?? '',
                    'Subject' => $approvalRequest->Subject ?? '',
                    'SubTitle' => $approvalRequest->SubTitle ?? '',
                    'VolumeNo' => $approvalRequest->VolumeNo ?? '',
                    'IssueNo' => $approvalRequest->IssueNo ?? '',
                    'IssueDate' => $approvalRequest->IssueDate ?? '',
                    'BroadClass' => $approvalRequest->BroadClass ?? '',
                    'AgencyCode' => $approvalRequest->AgencyCode ?? '',
                    'Type' => $approvalRequest->Type ?? '',
                    'Abstracts' => $approvalRequest->Abstracts ?? '',
                ]);
            }
        });

        return response()->json([
            'message' => 'Batch published successfully.',
            'batch' => $batch->refresh(),
        ]);
    }

    public function reportReviewers(): JsonResponse
    {
        $reviewers = User::query()
            ->select('id', 'full_name')
            ->whereHas('approvalLogs')
            ->orderBy('full_name')
            ->get();

        return response()->json(['reviewers' => $reviewers]);
    }

    public function generatePublishingSummaryReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
        ]);

        $batches = Batch::query()
            ->select('id', 'batch_name', 'quarter', 'year', 'status', 'shortlisted_date', 'published_date')
            ->where('quarter', $validated['quarter'])
            ->where('year', $validated['year'])
            ->where(function ($query): void {
                $query->whereNotNull('shortlisted_date')
                    ->orWhereIn('status', [
                        'for initial review',
                        'for quality approval',
                        'for publishing',
                        'published',
                    ]);
            })
            ->withCount([
                'approvalRequests as shortlisted_content_count',
                'approvalRequests as initial_review_approved_count' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 2)
                ),
                'approvalRequests as initial_review_disapproved_count' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 3)
                ),
                'approvalRequests as quality_approved_count' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 4)
                ),
                'approvalRequests as quality_disapproved_count' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 5)
                ),
                'approvalRequests as published_content_count' => fn ($query) => $query->where('approval_status', 6),
            ])
            ->orderBy('batch_name')
            ->get();

        return response()->json(['batches' => $batches]);
    }

    public function generatePublishingReviewerReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_id' => ['required', 'integer', 'exists:content_reviewers,id'],
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
        ]);

        $records = ApprovalRequest::query()
            ->select('id', 'Title', 'HoldingsID', 'batch_id')
            ->whereHas('batch', fn ($query) => $query
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->whereHas('approvalLogs', fn ($query) => $query
                ->where('content_reviewer_id', $validated['reviewer_id'])
                ->whereIn('progress_status', [2, 3, 4, 5]))
            ->with([
                'approvalLogs' => fn ($query) => $query
                    ->where('content_reviewer_id', $validated['reviewer_id'])
                    ->whereIn('progress_status', [2, 3, 4, 5])
                    ->orderBy('created_at')
                    ->with('logDetails'),
            ])
            ->orderBy('Title')
            ->get()
            ->flatMap(function (ApprovalRequest $approvalRequest) {
                return $approvalRequest->approvalLogs->map(fn ($approvalLog) => [
                    'title' => $approvalRequest->Title,
                    'holdings_id' => $approvalRequest->HoldingsID,
                    'status' => $this->formatReviewStatus((int) $approvalLog->progress_status),
                    'review_date' => $approvalLog->created_at?->toISOString(),
                    'reason_of_disapproval' => $approvalLog->logDetails
                        ->pluck('remarks')
                        ->filter()
                        ->implode(', '),
                    'remarks' => $approvalLog->remarks,
                ]);
            })
            ->values();

        return response()->json(['records' => $records]);
    }

    private function formatReviewStatus(int $progressStatus): string
    {
        return match ($progressStatus) {
            2 => 'Initial Review - Approved',
            3 => 'Initial Review - Disapproved',
            4 => 'Quality Assurance - Approved',
            5 => 'Quality Assurance - Disapproved',
            default => 'Reviewed',
        };
    }
}
