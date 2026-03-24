<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Batch;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

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
        return  $query->orderBy('created_at', 'desc')->paginate(5);
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
            'batch_name' => 'required|string|max:50|unique:content_batches,batch_name',
            'content_source' => 'required|string|max:100',
            'batch_description' => 'required|string|max:255',
            'target_published_date' => 'required|string|max:100',
        ]);


        $today = Carbon::today();
        $publishDate = Carbon::parse($request->target_published_date);
        $totalDays = $today->diffInDays($publishDate);

        $shortlistDate = $today->copy()->addDays(intval($totalDays * 0.2))->toDateString();
        $committeeReviewDate = $today->copy()->addDays(intval($totalDays * 0.5))->toDateString();
        $qualityApprovalDate = $today->copy()->addDays(intval($totalDays * 0.9))->toDateString();


        Batch::create([
            'batch_name' => $request->batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'target_published_date' => $request->target_published_date,
            'target_shortlist_date' => $shortlistDate,
            'target_initial_review_date' => $committeeReviewDate,
            'target_quality_approval_date' => $qualityApprovalDate,
            'status' => 'for shortlisting'
        ]);

        return response()->json([
            'message' => "Batches Successfully Created"
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
        $request->validate([
            'batch_name' => ['required', 'string', 'max:50', 'unique:content_batches,batch_name,' . $id . ',id'],
            'content_source' => ['required', 'string', 'max:100'],
            'batch_description' => ['required', 'string', 'max:255'],
            'target_published_date' => ['required', 'string', 'max:100'],
        ]);


        $today = Carbon::today();
        $publishDate = Carbon::parse($request->target_published_date);
        $totalDays = $today->diffInDays($publishDate);

        $shortlistDate = $today->copy()->addDays(intval($totalDays * 0.2))->toDateString();
        $committeeReviewDate = $today->copy()->addDays(intval($totalDays * 0.5))->toDateString();
        $qualityApprovalDate = $today->copy()->addDays(intval($totalDays * 0.9))->toDateString();

        $batch = Batch::find($id);
        $batch->update([
            'batch_name' => $request->batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'target_published_date' => $request->target_published_date,
            'target_shortlist_date' => $shortlistDate,
            'target_initial_review_date' => $committeeReviewDate,
            'target_quality_approval_date' => $qualityApprovalDate,
        ]);

        return response()->json([
            'message' => "Batches Successfully Updated"
        ]);
    }

    
}
