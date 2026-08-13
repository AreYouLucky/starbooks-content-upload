<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Request as ContentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ShortlistController extends Controller
{
    public function viewShortlistPage()
    {
        return Inertia::render(
            'shortlisted/shortlisted-page'
        );
    }

    public function index(Request $request)
    {
        $query = Batch::select('id', 'batch_name', 'content_source', 'batch_description', 'target_shortlist_date', 'shortlisted_date', 'status')
            ->where('is_active', 1);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search) {
                $builder->where('batch_name', 'LIKE', '%'.$search.'%')
                    ->orWhere('batch_description', 'LIKE', '%'.$search.'%');
            });
        }

        $analyticsQuery = clone $query;
        $analytics = [
            'for_shortlisting' => (clone $analyticsQuery)
                ->where('status', 'for shortlisting')
                ->count(),
            'shortlisted' => (clone $analyticsQuery)
                ->where('status', 'for initial review')
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
    public function create() {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {}

    /**
     * Display the specified resource.
     */
    public function show(string $name)
    {
        $batch = Batch::where('batch_name', $name)->first();
        $approval_requests = ContentRequest::where('batch_id', $batch->id)->get();

        return Inertia::render(
            'shortlisted/requests-list',
            [
                'approval_requests' => $approval_requests,
                'batch' => $batch,
            ]
        );
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id) {}

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id) {}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function toggleBatchShortlist(string $id)
    {
        $batch = Batch::where('id', $id)->first();
        if (! $batch->status == 'for shortlisting' || ! $batch->status == 'for initial review') {
            return response()->json([
                'status' => 'error',
            ], 400);
        }
        if ($batch->status == 'for shortlisting') {
            $batch->status = $batch->is_dost == 1 ? 'for quality approval' : 'for initial review';
            $batch->shortlisted_date = Carbon::today()->format('Y-m-d');
            if ($batch->is_dost == 1) {
                ContentRequest::where('batch_id', $id)->update(['approval_status' => 2]);
            } else {
                ContentRequest::where('batch_id', $id)->update(['approval_status' => 1]);
            }

        } else {
            ContentRequest::where('batch_id', $id)->update(['approval_status' => 0]);
            $batch->status = 'for shortlisting';
            $batch->shortlisted_date = null;
        }
        $batch->save();

        return response()->json([
            'status' => 'Batch Successfully Updated',
        ]);
    }

    public function generateReport(Request $req)
    {
        $req->validate([
            'quarter' => 'required|string|max:50',
            'year' => 'required|string|max:50',
        ]);
        $batches = Batch::where('quarter', $req->quarter)
            ->where('year', $req->year)
            ->where('status', 'for initial review')
            ->get();
        $batchIds = $batches->pluck('id');
        $records = ContentRequest::whereIn('batch_id', $batchIds)->get();

        return response()->json([
            'batches' => $batches,
            'records' => $records,
        ]);
    }
}
