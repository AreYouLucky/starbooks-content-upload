<?php

namespace App\Http\Controllers;

use App\Http\Requests\ViewPublishingRequestsRequest;
use App\Models\Batch;
use App\Models\Record;
use App\Models\Request as ContentRequest;
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

    public function publishingRequests(ViewPublishingRequestsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $filters = [
            'search' => $validated['search'] ?? '',
            'quarter' => $validated['quarter'] ?? 'all',
            'year' => $validated['year'] ?? 'all',
        ];

        $query = ContentRequest::query()
            ->with('batch:id,batch_name,content_source,quarter,year,target_published_date,quality_approval_date,published_date,status')
            ->where('is_active', 1)
            ->whereIn('approval_status', [4, 6])
            ->whereHas('batch', fn ($batchQuery) => $batchQuery
                ->where('is_active', 1))
            ->when($filters['quarter'] !== 'all', fn ($contentQuery) => $contentQuery->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('quarter', $filters['quarter'])
            ))
            ->when($filters['year'] !== 'all', fn ($contentQuery) => $contentQuery->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('year', $filters['year'])
            ))
            ->when($filters['search'] !== '', function ($contentQuery) use ($filters): void {
                $contentQuery->where(function ($searchQuery) use ($filters): void {
                    $searchQuery->where('HoldingsID', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Author', 'like', '%'.$filters['search'].'%')
                        ->orWhereHas('batch', fn ($batchQuery) => $batchQuery
                            ->where('batch_name', 'like', '%'.$filters['search'].'%')
                            ->orWhere('content_source', 'like', '%'.$filters['search'].'%'));
                });
            });

        $now = now();
        $currentQuarter = 'Q'.(int) ceil($now->month / 3);
        $currentYear = (string) $now->year;
        $eligibleBatches = Batch::query()
            ->where('is_active', 1)
            ->whereIn('status', ['for publishing', 'published'])
            ->whereHas('approvalRequests', fn ($contentQuery) => $contentQuery
                ->where('is_active', 1)
                ->whereIn('approval_status', [4, 6]));

        $analytics = [
            'for_publishing' => (clone $query)->where('approval_status', 4)->count(),
            'published' => (clone $query)->where('approval_status', 6)->count(),
            'total_contents' => (clone $query)->count(),
            'published_this_quarter' => ContentRequest::query()
                ->where('is_active', 1)
                ->where('approval_status', 6)
                ->whereHas('batch', fn ($batchQuery) => $batchQuery
                    ->where('is_active', 1))
                ->whereBetween('published_at', [
                    $now->copy()->startOfQuarter(),
                    $now->copy()->endOfQuarter(),
                ])
                ->count(),
            'published_this_year' => ContentRequest::query()
                ->where('is_active', 1)
                ->where('approval_status', 6)
                ->whereHas('batch', fn ($batchQuery) => $batchQuery
                    ->where('is_active', 1))
                ->whereBetween('published_at', [
                    $now->copy()->startOfYear(),
                    $now->copy()->endOfYear(),
                ])
                ->count(),
            'current_quarter' => $currentQuarter,
            'current_year' => $currentYear,
        ];

        $paginatedRequests = $query
            ->orderBy('approval_status')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json([
            ...$paginatedRequests->toArray(),
            'analytics' => $analytics,
            'filters' => $filters,
            'quarters' => (clone $eligibleBatches)->whereNotNull('quarter')->distinct()->orderBy('quarter')->pluck('quarter'),
            'years' => (clone $eligibleBatches)->whereNotNull('year')->distinct()->orderByDesc('year')->pluck('year'),
        ]);
    }

    public function publishRequest(string $id): JsonResponse
    {
        $publishedRequest = DB::transaction(function () use ($id): ContentRequest {
            $approvalRequest = ContentRequest::query()
                ->whereKey($id)
                ->where('is_active', 1)
                ->where('approval_status', 4)
                ->lockForUpdate()
                ->firstOrFail();

            $batch = Batch::query()
                ->whereKey($approvalRequest->batch_id)
                ->where('is_active', 1)
                ->lockForUpdate()
                ->firstOrFail();

            Record::query()->create($this->publishedRecordAttributes($approvalRequest));
            $approvalRequest->update([
                'approval_status' => 6,
                'published_at' => now(),
            ]);

            $hasUnpublishedContent = ContentRequest::query()
                ->where('batch_id', $batch->id)
                ->where('is_active', 1)
                ->where('approval_status', 4)
                ->exists();

            if (! $hasUnpublishedContent) {
                $batch->update([
                    'status' => 'published',
                    'published_date' => now(),
                ]);
            }

            return $approvalRequest->fresh('batch');
        });

        return response()->json([
            'message' => 'Content published successfully.',
            'request' => $publishedRequest,
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

        $contents = ContentRequest::query()
            ->select('id', 'Title', 'HoldingsID', 'approval_status', 'published_at', 'batch_id')
            ->where('is_active', 1)
            ->whereHas('batch', fn ($query) => $query
                ->where('is_active', 1)
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->with([
                'batch:id,batch_name,content_source',
                'approvalLogs' => fn ($query) => $query
                    ->select('id', 'request_id', 'progress_status')
                    ->whereIn('progress_status', [2, 3, 4, 5])
                    ->orderBy('id'),
            ])
            ->orderBy('Title')
            ->get()
            ->map(function (ContentRequest $approvalRequest): array {
                $initialReviewStatus = $approvalRequest->approvalLogs
                    ->whereIn('progress_status', [2, 3])
                    ->last()?->progress_status;
                $qualityAssuranceStatus = $approvalRequest->approvalLogs
                    ->whereIn('progress_status', [4, 5])
                    ->last()?->progress_status;

                return [
                    'title' => $approvalRequest->Title,
                    'holdings_id' => $approvalRequest->HoldingsID,
                    'batch_name' => $approvalRequest->batch?->batch_name,
                    'content_source' => $approvalRequest->batch?->content_source,
                    'initial_review_status' => match ($initialReviewStatus) {
                        2 => 'Approved',
                        3 => 'Disapproved',
                        default => 'Pending',
                    },
                    'quality_assurance_status' => match ($qualityAssuranceStatus) {
                        4 => 'Approved',
                        5 => 'Disapproved',
                        default => 'Pending',
                    },
                    'publishing_status' => (int) $approvalRequest->approval_status === 6
                        ? 'Published'
                        : 'Not Published',
                    'published_at' => $approvalRequest->published_at?->toISOString(),
                ];
            })
            ->values();

        return response()->json(['contents' => $contents]);
    }

    public function generatePublishingReviewerReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reviewer_id' => ['required', 'integer', 'exists:users,id'],
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
        ]);

        $reviewerId = $validated['reviewer_id'];
        $reviewLogFilter = fn ($query) => $query
            ->where('user_id', $reviewerId)
            ->whereIn('progress_status', [2, 3, 4, 5]);

        $records = ContentRequest::query()
            ->select('id', 'Title', 'HoldingsID', 'batch_id')
            ->whereHas('batch', fn ($query) => $query
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->whereHas('approvalLogs', $reviewLogFilter)
            ->with([
                'batch:id,batch_name,content_source,start_date,shortlisted_date,initial_reviewed_date,target_initial_review_date,target_quality_approval_date,target_published_date',
                'approvalLogs' => fn ($query) => $query
                    ->where('user_id', $reviewerId)
                    ->whereIn('progress_status', [2, 3, 4, 5])
                    ->orderBy('created_at')
                    ->with([
                        'logDetails',
                        'reviewer:id,full_name,role',
                    ]),
            ])
            ->orderBy('Title')
            ->get()
            ->flatMap(function (ContentRequest $approvalRequest) {
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

    private function forwardedDateForReview(ContentRequest $approvalRequest, int $progressStatus, ?string $reviewerRole): ?string
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

    private function targetDeadlineForReview(ContentRequest $approvalRequest, int $progressStatus, ?string $reviewerRole): ?string
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

    /**
     * @return array<string, mixed>
     */
    private function publishedRecordAttributes(ContentRequest $approvalRequest): array
    {
        return [
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
        ];
    }
}
