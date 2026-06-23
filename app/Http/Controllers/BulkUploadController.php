<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\LkContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class BulkUploadController extends Controller
{
    public function index(): void
    {
        //
    }

    public function create(): Response
    {
        $batches = Batch::query()->latest()->get();
        $contentGroups = LkContent::all();

        return Inertia::render('shortlisted/partials/bulk-upload', [
            'batches' => $batches,
            'content_group' => $contentGroups,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'Type' => ['required', 'string'],
            'Contents' => ['required', 'string', 'max:255'],
            'batch_id' => ['required', 'string', 'max:255'],
            'record_file' => ['required', 'file', 'mimetypes:text/plain,text/csv', 'max:5000'],
            'multimedia_file' => ['required', 'file', 'mimetypes:text/plain,text/csv', 'max:5000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $recordFile = $request->file('record_file');
        $recordFilePath = $recordFile->getRealPath();

        if ($recordFilePath === false || ($recordFileHandle = fopen($recordFilePath, 'r')) === false) {
            return response()->json([
                'errors' => ['record_file' => ['The record CSV could not be opened.']],
            ], 422);
        }

        $recordHeaders = fgetcsv($recordFileHandle);

        if ($recordHeaders === false) {
            fclose($recordFileHandle);

            return response()->json([
                'errors' => ['record_file' => ['The record CSV is empty.']],
            ], 422);
        }

        $recordHeaders = array_map(function (?string $header): string {
            return preg_replace('/^\xEF\xBB\xBF/', '', $this->normalizeCsvValue($header)) ?? '';
        }, $recordHeaders);

        $recordData = [];
        $rowNumber = 1;

        while (($row = fgetcsv($recordFileHandle)) !== false) {
            $rowNumber++;

            if ($row === [null]) {
                continue;
            }

            if (count($recordHeaders) !== count($row)) {
                fclose($recordFileHandle);

                return response()->json([
                    'errors' => [
                        'record_file' => ["CSV row {$rowNumber} does not match the header column count."],
                    ],
                ], 422);
            }

            $normalizedRow = array_map(
                fn (?string $value): string => $this->normalizeCsvValue($value),
                $row
            );
            $recordData[] = array_combine($recordHeaders, $normalizedRow);
        }

        fclose($recordFileHandle);

        try {
            DB::beginTransaction();

            foreach ($recordData as $record) {
                $holdingsId = $record['HoldingsID'] ?? '';

                if (DB::table('tblrecord')->where('HoldingsID', $holdingsId)->exists()
                    || ApprovalRequest::where('HoldingsID', $holdingsId)->exists()) {
                    DB::rollBack();

                    return response()->json([
                        'status' => 'Duplicate HoldingsID found in the database',
                        'error' => "HoldingsID already exists in the record: {$holdingsId}",
                    ], 422);
                }

                if ($holdingsId !== '') {
                    ApprovalRequest::create([
                        'HoldingsID' => $holdingsId,
                        'MaterialType' => $record['MaterialType'] ?? '',
                        'Title' => $record['Title'] ?? '',
                        'Subtitle' => $record['Subtitle'] ?? '',
                        'Abstracts' => $record['Abstracts'] ?? '',
                        'AgencyCode' => $record['AgencyCode'] ?? '',
                        'JournalTitle' => $record['JournalTitle'] ?? '',
                        'VolumeNo' => $record['VolumeNo'] ?? '',
                        'IssueNo' => $record['IssueNo'] ?? '',
                        'IssueDate' => $record['IssueDate'] ?? '',
                        'Author' => $record['Author'] ?? '',
                        'Subject' => $record['Subject'] ?? '',
                        'BroadClass' => $record['BroadClass'] ?? '',
                        'url' => $record['URL'] ?? '',
                        'Contents' => $request->Contents,
                        'Type' => $request->Type,
                        'date_uploaded' => Carbon::now(),
                        'batch_id' => $request->batch_id,
                    ]);
                }
            }

            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();

            return response()->json([
                'status' => 'Failed to save content',
                'error' => $exception->getMessage(),
            ], 500);
        }

        return response()->json(['status' => 'Content saved successfully']);
    }

    private function normalizeCsvValue(?string $value): string
    {
        if ($value === null || $value === '' || mb_check_encoding($value, 'UTF-8')) {
            return $value ?? '';
        }

        $sourceEncoding = mb_detect_encoding(
            $value,
            ['Windows-1252', 'ISO-8859-1'],
            true
        ) ?: 'Windows-1252';

        return mb_convert_encoding($value, 'UTF-8', $sourceEncoding);
    }

    public function show(string $id): void
    {
        //
    }

    public function edit(string $id): void
    {
        //
    }

    public function update(Request $request, string $id): void
    {
        //
    }

    public function destroy(string $id): void
    {
        //
    }
}
