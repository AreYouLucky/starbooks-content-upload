<?php

namespace App\Http\Controllers;

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

    public function index(Request $request)
    {

        $query = Batch::select('id', 'batch_name', 'content_source', 'batch_description', 'target_initial_review_date', 'initial_reviewed_date', 'status')
            ->where('is_active', 1)
            ->where('status', 'for initial review')
            ->withCount([
                'approvalRequests as pending' => fn($query) => $query->where('approval_status', 1),
                'approvalRequests as approved' => fn($query) => $query->where('approval_status', 2),
                'approvalRequests as disapproved' => fn($query) => $query->where('approval_status', 3),
            ]); 

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search) {
                $builder->where('batch_name', 'LIKE', '%' . $search . '%')
                    ->orWhere('batch_description', 'LIKE', '%' . $search . '%');
            });
        }

        $analyticsQuery = clone $query;
        $analytics = [
            'for_committee_review' => (clone $analyticsQuery)
                ->where('status', 'for initial review')
                ->count(),
            'reviewed' => (clone $analyticsQuery)
                ->where('initial_reviewed_date', '!=',null)
                ->count(),
        ];

        $paginatedBatches = $query->orderBy('created_at', 'desc')->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
