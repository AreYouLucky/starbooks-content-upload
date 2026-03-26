<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ApprovalRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Models\Batch;
use App\Models\LkContent;

class BulkUploadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $batches = Batch::orderBy('created_at', 'desc')->get();
        $lkcontent = LkContent::all();
        return Inertia::render('shortlisted/partials/bulk-upload', [
            'batches' => $batches,
            'content_group' => $lkcontent
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'Type' => 'required|string',
            'Contents' => 'required|string|max:255',
            'batch_id' => 'required|string|max:255',
            'record_file' => 'required|file|mimetypes:text/plain,text/csv|max:5000',
            'multimedia_file' => 'required|file|mimetypes:text/plain,text/csv|max:5000',

        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $record_file = $request->file('record_file');
        $record_fileHandle = fopen($record_file->getRealPath(), 'r');

        $record_headers = fgetcsv($record_fileHandle);
        $record_headers = array_map(function ($h) {
            return preg_replace('/^\xEF\xBB\xBF/', '', $h);
        }, $record_headers);

        $record_data = [];

        while (($row = fgetcsv($record_fileHandle)) !== false) {
            $rowData = array_combine($record_headers, $row);

            $rowData['Abstracts'] = str_replace(['Â¤', '?', 'Ã±'], [''], $rowData['Abstracts']);
            $rowData['Abstracts'] = str_replace(['Ã±', 'Ã‘'], ['n', 'N'], $rowData['Abstracts']);
            $rowData['Abstracts'] = mb_convert_encoding($rowData['Abstracts'], 'UTF-8', 'auto');

            $record_data[] = $rowData;
        }

        fclose($record_fileHandle);

        try {
            DB::beginTransaction();
            foreach ($record_data as $record) {
                if (DB::table('tblrecord')->where('HoldingsID', $record['HoldingsID'])->exists() || ApprovalRequest::where('HoldingsID', $record['HoldingsID'])->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'Duplicate HoldingsID found in the database',
                        'error' => "HoldingsID already exists in the record: {$record['HoldingsID']}",
                    ], 422);
                }
                if ($record['HoldingsID']) {
                    ApprovalRequest::create([
                        'HoldingsID' => $record['HoldingsID'],
                        'MaterialType' => $record['MaterialType']??"",
                        'Title' => $record['Title']??"",
                        'Subtitle' => $record['Subtitle']??"",
                        'Abstracts' => $record['Abstracts']??"",
                        'AgencyCode' => $record['AgencyCode']??"",
                        'JournalTitle' => $record['JournalTitle']??"",
                        'VolumeNo' => $record['VolumeNo']??"",
                        'IssueNo' => $record['IssueNo']??"",
                        'IssueDate' => $record['IssueDate']??"",
                        'Author' => $record['Author']??"",
                        'Subject' => $record['Subject']??"",
                        'BroadClass' => $record['BroadClass']??"",
                        'url' => $record['URL'] ?? '',
                        'Contents' => $request->Contents,
                        'Type' => $request->Type,
                        'date_uploaded' => Carbon::now(),
                        'batch_id' => $request->batch_id,
                    ]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'Failed to save content',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json(['status' => 'Content saved successfully'], 200);
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
