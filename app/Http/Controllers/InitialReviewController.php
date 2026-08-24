<?php

namespace App\Http\Controllers;

use App\Http\Requests\ViewInitialReviewRequestsRequest;
use App\Models\Batch;
use App\Models\Log;
use App\Models\LogDetail;
use App\Models\Request as ContentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InitialReviewController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function initialReviewPage(ViewInitialReviewRequestsRequest $request): Response
    {
        $validated = $request->validated();
        $filters = [
            'quarter' => $validated['quarter'] ?? 'all',
            'year' => $validated['year'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];

        $approvalRequests = ContentRequest::query()
            ->where('initial_reviewer_id', $request->user()->id)
            ->when($filters['quarter'] !== 'all', fn ($query) => $query->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('quarter', $filters['quarter'])
            ))
            ->when($filters['year'] !== 'all', fn ($query) => $query->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('year', $filters['year'])
            ))
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($searchQuery) use ($filters): void {
                    $searchQuery->where('HoldingsID', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Author', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Abstracts', 'like', '%'.$filters['search'].'%');
                });
            });

        $analytics = [
            'pending' => (clone $approvalRequests)->where('approval_status', 1)->count(),
            'approved' => (clone $approvalRequests)->where('approval_status', 2)->count(),
            'disapproved' => (clone $approvalRequests)->where('approval_status', 3)->count(),
        ];

        $availableBatches = Batch::query()
            ->whereHas('approvalRequests', fn ($query) => $query
                ->where('initial_reviewer_id', $request->user()->id));

        return Inertia::render('initial-review/requests-list', [
            'approval_requests' => $approvalRequests
                ->orderBy('approval_status')
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => $filters,
            'quarters' => (clone $availableBatches)->whereNotNull('quarter')->distinct()->orderBy('quarter')->pluck('quarter'),
            'years' => (clone $availableBatches)->whereNotNull('year')->distinct()->orderByDesc('year')->pluck('year'),
            'analytics' => $analytics,
        ]);
    }

    public function initialReviewBatches(Request $request)
    {

        $query = Batch::select('id', 'batch_name', 'content_source', 'batch_description', 'target_initial_review_date', 'initial_reviewed_date', 'status')
            ->where('is_active', 1)
            ->where(function ($query): void {
                $query->where('status', 'for initial review')
                    ->orWhereNotNull('initial_reviewed_date');
            })
            ->withCount([
                'approvalRequests as pending' => fn ($query) => $query->where('approval_status', 1),
                'approvalRequests as approved' => fn ($query) => $query->where('approval_status', 2),
                'approvalRequests as rejected' => fn ($query) => $query->where('approval_status', 3),
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search) {
                $builder->where('batch_name', 'LIKE', '%'.$search.'%')
                    ->orWhere('batch_description', 'LIKE', '%'.$search.'%');
            });
        }

        $analytics = [
            'for_initial_review' => Batch::query()
                ->where('is_active', 1)
                ->where('status', 'for initial review')
                ->count(),
            'reviewed' => Batch::query()
                ->where('is_active', 1)
                ->whereNotNull('initial_reviewed_date')
                ->count(),
        ];

        $paginatedBatches = $query
            ->orderByRaw("case when status = 'for initial review' then 0 else 1 end")
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    public function viewApprovalRequests(string $name): RedirectResponse
    {
        return redirect('/initial-review-page');
    }

    public function reviewRequest(string $holdingsID)
    {
        $request = ContentRequest::with('batch')->where('HoldingsID', $holdingsID)->first();

        if (! $request) {
            return redirect('/already-reviewed');
        }

        return Inertia::render(
            'initial-review/partials/review-request-form',
            [
                'approval_request' => $request,
                'batch' => $request->batch,
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function submitReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holdings_id' => ['required', 'string', 'max:50', Rule::exists('requests', 'HoldingsID')],
            'review_decision' => ['required', 'string', Rule::in(['approved', 'disapproved'])],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'disapproval_reasons' => ['required_if:review_decision,disapproved', 'array', 'min:1'],
            'disapproval_reasons.*' => [
                'string',
                Rule::in([
                    'Accuracy',
                    'Authority/Credibility',
                    'Coverage and Relevance',
                    'Purpose and Objectivity',
                    'Recency',
                ]),
            ],
        ]);

        try {
            DB::beginTransaction();
            $approvalRequest = ContentRequest::where('HoldingsID', $validated['holdings_id'])->firstOrFail();
            $approvalStatus = $validated['review_decision'] === 'disapproved' ? 3 : 2;
            $approvalRequest->forceFill([
                'approval_status' => $approvalStatus,
                'initial_reviewed_date' => now(),
            ])->save();

            $log = Log::query()->forceCreate([
                'request_id' => $approvalRequest->id,
                'user_id' => Auth::id(),
                'batch_id' => $approvalRequest->batch_id,
                'is_approved' => $approvalStatus === 2,
                'approval_status' => $approvalStatus,
                'progress_status' => $approvalStatus,
                'remarks' => $validated['remarks'] ?? '',
            ]);

            $disapprovalReasons = $approvalStatus === 3 ? $validated['disapproval_reasons'] ?? [] : [];

            foreach ($disapprovalReasons as $reason) {
                LogDetail::query()->forceCreate([
                    'approval_status' => $approvalStatus,
                    'request_id' => $approvalRequest->id,
                    'user_id' => Auth::id(),
                    'log_id' => $log->id,
                    'is_passed' => false,
                    'description' => $reason,
                    'remarks' => $reason,
                ]);
            }
            DB::commit();

            return response()->json(['message' => 'Review successfully saved.']);
        } catch (\Throwable $exception) {
            DB::rollBack();
            report($exception);

            return response()->json([
                'message' => 'Failed to submit review. Please try again.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function generateInitialReviewReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
        ]);

        $batches = Batch::query()
            ->where('quarter', $validated['quarter'])
            ->where('year', $validated['year'])
            ->where('status', '!=', 'for initial review')
            ->whereHas(
                'approvalRequests.approvalLogs',
                fn ($query) => $query->whereIn('progress_status', [2, 3])
            )
            ->with([
                'approvalRequests' => fn ($query) => $query
                    ->whereHas(
                        'approvalLogs',
                        fn ($query) => $query->whereIn('progress_status', [2, 3])
                    )
                    ->with([
                        'approvalLogs.logDetails',
                        'approvalLogs.reviewer:id,full_name',
                    ]),
            ])
            ->get();

        return response()->json([
            'batches' => $batches,
            'records' => $batches
                ->flatMap(fn (Batch $batch) => $batch->approvalRequests)
                ->values(),
        ]);
    }

    public function forwardToQA(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batchName' => ['required', 'string', 'max:255'],
        ]);

        $batch = Batch::query()
            ->where('batch_name', $validated['batchName'])
            ->where('status', 'for initial review')
            ->firstOrFail();

        if ($batch->approvalRequests()->where('approval_status', 1)->exists()) {
            return response()->json([
                'message' => 'Complete all pending initial reviews before forwarding.',
            ], 422);
        }

        DB::transaction(function () use ($batch): void {
            $batch->update([
                'status' => 'for quality approval',
                'initial_reviewed_date' => now(),
            ]);
        });

        return response()->json(['message' => 'Batch successfully forwarded to Quality Assurance Approval.']);
    }
}
