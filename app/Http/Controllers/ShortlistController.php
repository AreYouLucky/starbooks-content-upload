<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ApprovalRequest;
use App\Models\ApprovalMultimedia;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use App\Models\Batch;

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
        $query = Batch::select('id','batch_name', 'content_source', 'batch_description', 'target_shortlist_date', 'shortlisted_date', 'status')->where('is_active', 1);
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

    public function toggleBatchShortlist(String $id)
    {
        $batch = Batch::where('id', $id)->first();
        if (!$batch->status == 'for shortlisting' || !$batch->status == 'for initial review') {
            return response()->json([
                'status' => 'error',
            ], 400);
        }
        if ($batch->status == "for shortlisting") {
            $batch->status = "for initial review";
            $batch->shortlisted_date = Carbon::today()->format('Y-m-d');
        } else {
            $batch->status = "for shortlisting";
            $batch->shortlisted_date = null;
        }
        $batch->save();
        return response()->json([
            'status' => 'Batch Successfully Updated'
        ]);
    }
}
