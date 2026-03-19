<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Batch;
use Inertia\Inertia;

class BatchesController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function viewBatches(){
        return Inertia::render('batches/batches-page');
    }

    public function index()
    {
        return Batch::orderBy('created_at', 'desc')->get();
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
            'batch_name' => 'required|string|max:50|unique:batches,batch_name',
            'content_source' => 'required|string|max:100',
            'batch_description' => 'required|string|max:255',
            'target_published_date' => 'required|string|max:100',
            'target_initial_review_date' => 'required|string|max:100',
            'target_committee_review_date' => 'required|string|max:100',
        ]);

        Batch::create([
            'batch_name' => $request->batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'target_published_date' => $request->target_published_date,
            'target_initial_review_date' => $request->target_initial_review_date,
            'target_committee_review_date' => $request->target_committee_review_date,
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

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $batch = Batch::find($id);

        return Inertia::render('batches/batch-form', [
            'batch' => $batch
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'batch_name' => ['required|string|max:50|unique:batches,batch_name,'.$id .',id'],
            'content_source' => ['required|string|max:100'],
            'batch_description' => ['required|string|max:255'],
            'target_published_date' => ['required|string|max:100'],
            'target_initial_review_date' => ['required|string|max:100'],
            'target_committee_review_date' => ['required|string|max:100'],
        ]);

        $batch = Batch::find($id);
        $batch->update([
            'batch_name' => $request->batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'target_published_date' => $request->target_published_date,
            'target_initial_review_date' => $request->target_initial_review_date,
            'target_committee_review_date' => $request->target_committee_review_date,
        ]);

        return response()->json([
            'message' => "Batches Successfully Updated"
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $batch = Batch::find($id);
        $batch->delete();
        return response()->json([
            'message' => "Batches Successfully Deleted"
        ]);
    }
}
