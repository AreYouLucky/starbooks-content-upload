<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\Batch;
use Illuminate\Http\Request;
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
                'approvalRequests as disapproved' => fn ($query) => $query->where('approval_status', 3),
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
        $request = ApprovalRequest::where('HoldingsID', $holdingsID)->first();

        if (!$request) {
            redirect()->route('/already-reviewed');
        }
        return Inertia::render(
            'committee-review/partials/review-request-form',
            [
                'approval_request' => $request,
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }
}
