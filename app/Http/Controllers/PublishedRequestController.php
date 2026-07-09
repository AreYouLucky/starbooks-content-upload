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
            ->select('id', 'full_name', 'role')
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

        $reviewerId = $validated['reviewer_id'];
        $reviewLogFilter = fn ($query) => $query
            ->where('content_reviewer_id', $reviewerId)
            ->whereIn('progress_status', [2, 3, 4, 5]);

        $records = ApprovalRequest::query()
            ->select('id', 'Title', 'HoldingsID', 'batch_id')
            ->whereHas('batch', fn ($query) => $query
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->whereHas('approvalLogs', $reviewLogFilter)
            ->with([
                'batch:id,batch_name,content_source,start_date,shortlisted_date,initial_reviewed_date,target_initial_review_date,target_quality_approval_date,target_published_date',
                'approvalLogs' => fn ($query) => $query
                    ->where('content_reviewer_id', $reviewerId)
                    ->whereIn('progress_status', [2, 3, 4, 5])
                    ->orderBy('created_at')
                    ->with([
                        'logDetails',
                        'reviewer:id,full_name,role',
                    ]),
            ])
            ->orderBy('Title')
            ->get()
            ->flatMap(function (ApprovalRequest $approvalRequest) {
                return $approvalRequest->approvalLogs->map(fn ($approvalLog) => [
                    'batch_name' => $approvalRequest->batch?->batch_name,
                    'content_source' => $approvalRequest->batch?->content_source,
                    'title' => $approvalRequest->Title,
                    'holdings_id' => $approvalRequest->HoldingsID,
                    'reviewer_name' => $approvalLog->reviewer?->full_name,
                    'reviewer_role' => $approvalLog->reviewer?->role,
                    'status' => $this->formatReviewStatus((int) $approvalLog->progress_status),
                    'date_forwarded' => $this->forwardedDateForReview(
                        $approvalRequest,
                        (int) $approvalLog->progress_status,
                        $approvalLog->reviewer?->role
                    ),
                    'target_deadline' => $this->targetDeadlineForReview(
                        $approvalRequest,
                        (int) $approvalLog->progress_status,
                        $approvalLog->reviewer?->role
                    ),
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

    private function forwardedDateForReview(ApprovalRequest $approvalRequest, int $progressStatus, ?string $reviewerRole): ?string
    {
        if ($reviewerRole === 'quality') {
            return $approvalRequest->batch?->initial_reviewed_date;
        }

        if ($reviewerRole === 'committee') {
            return $approvalRequest->batch?->shortlisted_date;
        }

        if ($reviewerRole === 'stii_admin') {
            return $approvalRequest->batch?->start_date;
        }

        return match ($progressStatus) {
            2, 3 => $approvalRequest->batch?->shortlisted_date,
            4, 5 => $approvalRequest->batch?->initial_reviewed_date,
            default => $approvalRequest->batch?->start_date,
        };
    }

    private function targetDeadlineForReview(ApprovalRequest $approvalRequest, int $progressStatus, ?string $reviewerRole): ?string
    {
        if ($reviewerRole === 'quality') {
            return $approvalRequest->batch?->target_quality_approval_date;
        }

        if ($reviewerRole === 'committee') {
            return $approvalRequest->batch?->target_initial_review_date;
        }

        if ($reviewerRole === 'stii_admin') {
            return $approvalRequest->batch?->target_published_date;
        }

        return match ($progressStatus) {
            2, 3 => $approvalRequest->batch?->target_initial_review_date,
            4, 5 => $approvalRequest->batch?->target_quality_approval_date,
            default => $approvalRequest->batch?->target_published_date,
        };
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
