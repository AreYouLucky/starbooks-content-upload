<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Support\BatchSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BatchesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function viewBatches()
    {
        return Inertia::render('batches/batches-page');
    }

    public function index(Request $request)
    {
        $query = Batch::where('is_active', 1);
        if ($request->filled('search')) {
            $query->where('batch_name', 'LIKE', '%' . $request->search . '%')
                ->orWhere('batch_description', 'LIKE', '%' . $request->search . '%');
        }

        return $query->orderBy('created_at', 'desc')->paginate(5);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('batches/batch-form');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'content_source' => 'required|string|max:100',
            'year' => 'required|string|max:50',
            'quarter' => 'required|string|max:50',
            'batch_description' => 'required|string|max:255',
            'start_date' => 'required|string|max:100',
            'is_dost' => 'required|boolean',
            'target_shortlist_date' => 'required|string|max:100',
            'target_initial_review_date' => 'required|string|max:100',
            'target_quality_approval_date' => 'required|string|max:100',
            'target_published_date' => 'required|string|max:100',
        ]);

        $isDost = $request->boolean('is_dost');

        $existing_count = Batch::where('year', $request->year)
            ->where('quarter', $request->quarter)
            ->count();

        $batch_number = str_pad($existing_count + 1, 4, '0', STR_PAD_LEFT);
        $batch_name = $request->year . Str::upper($request->quarter) . '-B' . $batch_number;

        Batch::create([
            'batch_name' => $batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'status' => 'for shortlisting',
            'is_dost' => $isDost,
            'year' => $request->year,
            'quarter' => $request->quarter,
            'start_date' => Carbon::parse($request->start_date)->toDateString(),
            'target_shortlist_date' => Carbon::parse($request->target_shortlist_date)->toDateString(),
            'target_initial_review_date' => Carbon::parse($request->target_initial_review_date)->toDateString(),
            'target_quality_approval_date' => Carbon::parse($request->target_quality_approval_date)->toDateString(),
            'target_published_date' => Carbon::parse($request->target_published_date)->toDateString(),
        ]);

        return response()->json([
            'message' => 'Batches Successfully Created',
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'content_source' => 'required|string|max:100',
            'year' => 'required|string|max:50',
            'quarter' => 'required|string|max:50',
            'batch_description' => 'required|string|max:255',
            'start_date' => 'required|string|max:100',
            'is_dost' => 'required|boolean',
            'target_shortlist_date' => 'required|string|max:100',
            'target_initial_review_date' => 'required|string|max:100',
            'target_quality_approval_date' => 'required|string|max:100',
            'target_published_date' => 'required|string|max:100',
        ]);

        $batch = Batch::find($id);
        $isDost = $request->boolean('is_dost');

        $batch->update([
            'content_source' => $validated['content_source'],
            'batch_description' => $validated['batch_description'],
            'is_dost' => $isDost,
            'start_date' => Carbon::parse($request->start_date)->toDateString(),
            'target_shortlist_date' => Carbon::parse($request->target_shortlist_date)->toDateString(),
            'target_initial_review_date' => Carbon::parse($request->target_initial_review_date)->toDateString(),
            'target_quality_approval_date' => Carbon::parse($request->target_quality_approval_date)->toDateString(),
            'target_published_date' => Carbon::parse($request->target_published_date)->toDateString(),
        ]);

        return response()->json([
            'message' => 'Batches Successfully Updated',
        ]);
    }
}
