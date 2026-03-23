<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ApprovalRequest;
use App\Models\ApprovalMultimedia;
use Inertia\Inertia;
use App\Models\Batch;

class ShortlistController extends Controller
{

    public function viewShortlistPage(){
        $batches = Batch::orderBy('created_at', 'desc')->get();
        return Inertia::render(
            'shortlisted/shortlisted-page',
            [
                'batches' => $batches
            ]
        );
    }

    public function index()
    {
        return ApprovalRequest::join('content_batch', 'content_approval_request.batch_id', '=', 'content_batch.id')->where('approval_status', 0)->paginate(10);
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
