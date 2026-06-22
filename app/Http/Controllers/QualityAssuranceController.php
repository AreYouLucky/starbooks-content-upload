<?php

namespace App\Http\Controllers;

use App\Models\ApprovalLog;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\LogDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QualityAssuranceController extends Controller
{
    public function qualityAssurancePage(): Response
    {
        return Inertia::render('quality-assurance/quality-assurance-page');
    }

    public function qualityAssuranceBatches(Request $request): JsonResponse
    {
        $query = Batch::query()
            ->select('id', 'batch_name', 'content_source', 'batch_description', 'target_quality_approval_date', 'quality_approval_date', 'status')
            ->where('is_active', 1)
            ->where('status', 'for quality approval')
            ->withCount([
                'approvalRequests as pending' => fn($query) => $query->where('approval_status', 2),
                'approvalRequests as approved' => fn($query) => $query->whereHas(
                    'approvalLogs',
                    fn($query) => $query->where('progress_status', 4)
                ),
                'approvalRequests as rejected' => fn($query) => $query->whereHas(
                    'approvalLogs',
                    fn($query) => $query->where('progress_status', 5)
                ),
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('batch_name', 'like', '%' . $search . '%')
                    ->orWhere('batch_description', 'like', '%' . $search . '%');
            });
        }

        $analytics = [
            'for_quality_assurance' => (clone $query)->count(),
            'reviewed' => Batch::query()
                ->where('is_active', 1)
                ->whereNotNull('quality_approval_date')
                ->count(),
        ];

        $paginatedBatches = $query->latest()->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    public function viewApprovalRequests(string $name): Response
    {
        $batch = Batch::query()
            ->where('batch_name', $name)
            ->where('status', 'for quality approval')
            ->firstOrFail();

        $approvalRequests = $batch->approvalRequests()
            ->where(function ($query): void {
                $query->where('approval_status', 2)
                    ->orWhereHas(
                        'approvalLogs',
                        fn($query) => $query->whereIn('progress_status', [4, 5])
                    );
            })
            ->orderBy('approval_status')
            ->get();

        return Inertia::render('quality-assurance/requests-list', [
            'approval_requests' => $approvalRequests,
            'batch' => $batch,
        ]);
    }

    public function reviewRequest(string $holdingsID): Response
    {
        $approvalRequest = ApprovalRequest::query()
            ->with('batch')
            ->where('HoldingsID', $holdingsID)
            ->where('approval_status', 2)
            ->whereHas('batch', fn($query) => $query->where('status', 'for quality approval'))
            ->firstOrFail();

        return Inertia::render('quality-assurance/partials/review-request-form', [
            'approval_request' => $approvalRequest,
            'batch' => $approvalRequest->batch,
        ]);
    }

    public function submitReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'holdings_id' => ['required', 'string', 'max:50', Rule::exists('content_approval_requests', 'HoldingsID')],
            'review_decision' => ['required', 'string', Rule::in(['approved', 'disapproved'])],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'disapproval_reasons' => ['required_if:review_decision,disapproved', 'array', 'min:1'],
            'disapproval_reasons.*' => ['string', Rule::in([
                'Completeness',
                'Readability',
                'Clarity',
                'Quality',
            ])],
        ]);

        DB::transaction(function () use ($validated): void {
            $approvalRequest = ApprovalRequest::query()
                ->where('HoldingsID', $validated['holdings_id'])
                ->where('approval_status', 2)
                ->whereHas('batch', fn($query) => $query->where('status', 'for quality approval'))
                ->lockForUpdate()
                ->firstOrFail();
            $approvalStatus = $validated['review_decision'] === 'approved' ? 4 : 5;

            $approvalRequest->update(['approval_status' => $approvalStatus]);

            $approvalLog = ApprovalLog::query()->forceCreate([
                'approval_request_id' => $approvalRequest->id,
                'content_reviewer_id' => Auth::id(),
                'batch_id' => $approvalRequest->batch_id,
                'is_approved' => $approvalStatus === 4,
                'progress_status' => $approvalStatus,
                'remarks' => $validated['remarks'] ?? '',
            ]);


            $disapprovalReasons = $approvalStatus === 5 ? $validated['disapproval_reasons'] ?? [] : [];

            foreach ($disapprovalReasons as $reason) {
                LogDetail::query()->forceCreate([
                    'approval_request_id' => $approvalRequest->id,
                    'content_reviewer_id' => Auth::id(),
                    'content_log_id' => $approvalLog->id,
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
                fn($query) => $query->whereIn('progress_status', [4, 5])
            )
            ->with([
                'approvalRequests' => fn($query) => $query
                    ->whereHas(
                        'approvalLogs',
                        fn($query) => $query->whereIn('progress_status', [4, 5])
                    )
                    ->with([
                        'approvalLogs' => fn($query) => $query
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
                ->flatMap(fn(Batch $batch) => $batch->approvalRequests)
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
