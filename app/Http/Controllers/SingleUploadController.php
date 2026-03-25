<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LkContent;
use Inertia\Inertia;
use App\Models\Batch;
use App\Models\ApprovalRequest;

class SingleUploadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $content_group = LkContent::all();
        $batches = Batch::orderBy('created_at', 'desc')->get();
        return Inertia::render('shortlisted/partials/single-upload-form', ['content_group' => $content_group, 'batches' => $batches]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'Title' => 'required|string|unique:tblrecord,Title|unique:content_approval_requests,Title',
            'Author' => 'required|string',
            'HoldingsID' => 'required|string',
            'Contents' => 'required|string',
            'MaterialType' => 'required|string',
            'JournalTitle' => 'nullable|string',
            'Subject' => 'nullable|string',
            'SubTitle' => 'nullable|string',
            'VolumeNo' => 'nullable|string',
            'IssueNo' => 'nullable|string',
            'IssueDate' => 'nullable|string',
            'BroadClass' => 'required|string',
            'AgencyCode' => 'required|string',
            'Type' => 'required|string',
            'batch_id' => 'required|string',
            'Abstracts' => 'required|string',
        ]);

        $request = ApprovalRequest::create([
            'Title' => $request->Title ?? "",
            'Author' => $request->Author ?? "",
            'HoldingsID' => $request->HoldingsID ?? "",
            'Contents' => $request->Contents ?? "",
            'MaterialType' => $request->MaterialType ?? "",
            'JournalTitle' => $request->JournalTitle ?? "",
            'Subject' => $request->Subject ?? "",
            'SubTitle' => $request->SubTitle ?? "",
            'VolumeNo' => $request->VolumeNo ?? "",
            'IssueNo' => $request->IssueNo ?? "",
            'IssueDate' => $request->IssueDate ?? "",
            'BroadClass' => $request->BroadClass ?? "",
            'AgencyCode' => $request->AgencyCode ?? "",
            'Type' => $request->Type ?? "",
            'batch_id' => $request->batch_id ?? "",
            'Abstracts' => $request->Abstracts ?? "",
        ]);
        return response()->json([
            'status' => 'Request Successfully Created',
            'approval_request' => $request
        ], 200);
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
