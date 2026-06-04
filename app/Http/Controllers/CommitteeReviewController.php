<?php

namespace App\Http\Controllers;

use App\Models\ApprovalLog;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\LogDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CommitteeReviewController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function committeeReviewPage()
    {
        return Inertia::render(
            'committee-review/committee-review-page'
        );
    }

    public function CommitteeReviewBatches(Request $request)
    {

        $query = Batch::select('id', 'batch_name', 'content_source', 'batch_description', 'target_initial_review_date', 'initial_reviewed_date', 'status')
            ->where('is_active', 1)
            ->where('status', 'for initial review')
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

        $analyticsQuery = clone $query;
        $analytics = [
            'for_committee_review' => (clone $analyticsQuery)
                ->where('status', 'for initial review')
                ->count(),
            'reviewed' => (clone $analyticsQuery)
                ->where('initial_reviewed_date', '!=', null)
                ->count(),
        ];

        $paginatedBatches = $query->orderBy('created_at', 'desc')->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    public function viewApprovalRequests(string $name)
    {
        $batch = Batch::where('batch_name', $name)->first();
        $approval_requests = ApprovalRequest::where('batch_id', $batch->id)->orderBy('approval_status', 'asc')->get();

        return Inertia::render(
            'committee-review/requests-list',
            [
                'approval_requests' => $approval_requests,
                'batch' => $batch,
            ]
        );
    }

    public function ReviewRequest(string $holdingsID)
    {
        $request = ApprovalRequest::with('batch')->where('HoldingsID', $holdingsID)->first();

        if (! $request) {
            return redirect('/already-reviewed');
        }

        return Inertia::render(
            'committee-review/partials/review-request-form',
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
            'holdings_id' => ['required', 'string', 'max:50', Rule::exists('content_approval_requests', 'HoldingsID')],
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
            DB::transaction(function () use ($validated): void {
                $approvalRequest = ApprovalRequest::where('HoldingsID', $validated['holdings_id'])->firstOrFail();
                $approvalStatus = $validated['review_decision'] === 'disapproved' ? 3 : 2;

                $approvalRequest->forceFill([
                    'approval_status' => $approvalStatus,
                ])->save();

                $log = ApprovalLog::create([
                    'approval_request_id' => $approvalRequest->id,
                    'content_reviewer_id' => Auth::id(),
                    'batch_id' => $approvalRequest->batch_id,
                    'progress_status' => $approvalStatus,
                    'remarks' => $validated['remarks'] ?? '',
                ]);

                $disapprovalReasons = $approvalStatus === 3 ? $validated['disapproval_reasons'] ?? [] : [];

                foreach ($disapprovalReasons as $reason) {
                    LogDetail::create([
                        'approval_request_id' => $approvalRequest->id,
                        'content_reviewer_id' => Auth::id(),
                        'content_log_id' => $log->id,
                        'remarks' => $reason,
                    ]);
                }
            });

            return response()->json(['message' => 'Review successfully saved.']);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Failed to submit review. Please try again.',
                'error' => $exception->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }
}
