<?php

namespace App\Http\Controllers;

use App\Http\Requests\ViewQualityAssuranceRequestsRequest;
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

class QualityAssuranceController extends Controller
{
    public function qualityAssurancePage(ViewQualityAssuranceRequestsRequest $request): Response
    {
        $validated = $request->validated();
        $filters = [
            'quarter' => $validated['quarter'] ?? 'all',
            'year' => $validated['year'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];

        $approvalRequests = ContentRequest::query()
            ->where('quality_assurance_reviewer_id', $request->user()->id)
            ->whereIn('approval_status', [2, 4, 5])
            ->whereHas('batch', fn ($query) => $query
                ->where(fn ($batchQuery) => $batchQuery
                    ->where('status', 'for quality approval')
                    ->orWhereNotNull('quality_approval_date')))
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
            'pending' => (clone $approvalRequests)->where('approval_status', 2)->count(),
            'approved' => (clone $approvalRequests)->where('approval_status', 4)->count(),
            'disapproved' => (clone $approvalRequests)->where('approval_status', 5)->count(),
        ];

        $availableBatches = Batch::query()
            ->where(fn ($query) => $query
                ->where('status', 'for quality approval')
                ->orWhereNotNull('quality_approval_date'))
            ->whereHas('approvalRequests', fn ($query) => $query
                ->where('quality_assurance_reviewer_id', $request->user()->id)
                ->whereIn('approval_status', [2, 4, 5]));

        return Inertia::render('quality-assurance/requests-list', [
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

    public function qualityAssuranceBatches(Request $request): JsonResponse
    {
        $query = Batch::query()
            ->select('id', 'batch_name', 'content_source', 'batch_description', 'target_quality_approval_date', 'quality_approval_date', 'status')
            ->where('is_active', 1)
            ->where(function ($query): void {
                $query->where('status', 'for quality approval')
                    ->orWhereNotNull('quality_approval_date');
            })
            ->withCount([
                'approvalRequests as pending' => fn ($query) => $query->where('approval_status', 2),
                'approvalRequests as approved' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 4)
                ),
                'approvalRequests as rejected' => fn ($query) => $query->whereHas(
                    'approvalLogs',
                    fn ($query) => $query->where('progress_status', 5)
                ),
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('batch_name', 'like', '%'.$search.'%')
                    ->orWhere('batch_description', 'like', '%'.$search.'%');
            });
        }

        $analytics = [
            'for_quality_assurance' => Batch::query()
                ->where('is_active', 1)
                ->where('status', 'for quality approval')
                ->count(),
            'reviewed' => Batch::query()
                ->where('is_active', 1)
                ->whereNotNull('quality_approval_date')
                ->count(),
        ];

        $paginatedBatches = $query
            ->orderByRaw("case when status = 'for quality approval' then 0 else 1 end")
            ->latest()
            ->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    public function viewApprovalRequests(string $name): RedirectResponse
    {
        return redirect('/quality-assurance-page');
    }

    public function reviewRequest(Request $request, string $holdingsID): Response
    {
        $approvalRequest = ContentRequest::query()
            ->with('batch')
            ->where('HoldingsID', $holdingsID)
            ->where('quality_assurance_reviewer_id', $request->user()->id)
            ->where('approval_status', 2)
            ->whereHas('batch', fn ($query) => $query->where('status', 'for quality approval'))
            ->firstOrFail();

        return Inertia::render('quality-assurance/partials/review-request-form', [
            'approval_request' => $approvalRequest,
            'batch' => $approvalRequest->batch,
        ]);
    }

    public function submitReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holdings_id' => ['required', 'string', 'max:50', Rule::exists('requests', 'HoldingsID')],
            'review_decision' => ['required', 'string', Rule::in(['approved', 'disapproved'])],
            'remarks' => ['required_if:review_decision,disapproved', 'nullable', 'string', 'max:1000'],
            'disapproval_reasons' => ['required_if:review_decision,disapproved', 'array', 'min:1'],
            'disapproval_reasons.*' => ['string', Rule::in([
                'Completeness',
                'Readability',
                'Clarity',
                'Quality',
            ])],
        ]);

        DB::transaction(function () use ($request, $validated): void {
            $approvalRequest = ContentRequest::query()
                ->where('HoldingsID', $validated['holdings_id'])
                ->where('quality_assurance_reviewer_id', $request->user()->id)
                ->where('approval_status', 2)
                ->whereHas('batch', fn ($query) => $query->where('status', 'for quality approval'))
                ->lockForUpdate()
                ->firstOrFail();
            $approvalStatus = $validated['review_decision'] === 'approved' ? 4 : 5;

            $approvalRequest->update(['approval_status' => $approvalStatus]);

            $approvalLog = Log::query()->forceCreate([
                'request_id' => $approvalRequest->id,
                'user_id' => Auth::id(),
                'batch_id' => $approvalRequest->batch_id,
                'is_approved' => $approvalStatus === 4,
                'approval_status' => $approvalStatus,
                'progress_status' => $approvalStatus,
                'remarks' => $validated['remarks'] ?? '',
            ]);

            $disapprovalReasons = $approvalStatus === 5 ? $validated['disapproval_reasons'] ?? [] : [];

            foreach ($disapprovalReasons as $reason) {
                LogDetail::query()->forceCreate([
                    'approval_status' => $approvalStatus,
                    'request_id' => $approvalRequest->id,
                    'user_id' => Auth::id(),
                    'log_id' => $approvalLog->id,
                    'is_passed' => false,
                    'description' => $reason,
                    'remarks' => $reason,
                ]);
            }
        });

        return response()->json(['message' => 'Quality assurance review successfully saved.']);
    }

    public function generateQualityAssuranceReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
        ]);

        $batches = Batch::query()
            ->where('quarter', $validated['quarter'])
            ->where('year', $validated['year'])
            ->whereHas(
                'approvalRequests.approvalLogs',
                fn ($query) => $query->whereIn('progress_status', [4, 5])
            )
            ->with([
                'approvalRequests' => fn ($query) => $query
                    ->whereHas(
                        'approvalLogs',
                        fn ($query) => $query->whereIn('progress_status', [4, 5])
                    )
                    ->with([
                        'approvalLogs' => fn ($query) => $query
                            ->whereIn('progress_status', [4, 5])
                            ->with([
                                'logDetails',
                                'reviewer:id,full_name',
                            ]),
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

    public function forwardToPublishing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batchName' => ['required', 'string', 'max:255'],
        ]);

        $batch = Batch::query()
            ->where('batch_name', $validated['batchName'])
            ->where('status', 'for quality approval')
            ->firstOrFail();

        if ($batch->approvalRequests()->where('approval_status', 2)->exists()) {
            return response()->json([
                'message' => 'Complete all pending quality assurance reviews before forwarding.',
            ], 422);
        }

        $batch->update([
            'status' => 'for publishing',
            'quality_approval_date' => now(),
        ]);

        return response()->json(['message' => 'Batch successfully forwarded for publishing.']);
    }
}
