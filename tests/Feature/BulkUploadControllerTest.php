<?php

use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    Schema::create('tblrecord', function (Blueprint $table) {
        $table->id();
        $table->string('HoldingsID')->unique();
    });
});

function createBulkUploadUser(): User
{
    return User::query()->create([
        'username' => 'bulk_'.Str::lower(Str::random(8)),
        'full_name' => 'Bulk Upload '.Str::random(6),
        'delivery_unit' => 'STII',
        'role' => 'stii_admin',
        'designation' => 'Uploader',
        'task_description' => 'Bulk upload test',
        'password' => Hash::make('password'),
    ]);
}

function createBulkUploadBatch(): Batch
{
    return Batch::query()->forceCreate([
        'batch_name' => 'Bulk '.Str::upper(Str::random(5)),
        'quarter' => 'Q2',
        'year' => '2026',
        'content_source' => 'PCAARRD',
        'batch_description' => 'Bulk upload encoding test',
        'target_published_date' => '2026-07-31',
        'target_initial_review_date' => '2026-07-01',
        'target_committee_review_date' => '2026-07-15',
    ]);
}

function uploadedCsv(string $name, string $contents): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'starbooks-csv-');
    file_put_contents($path, $contents);

    return new UploadedFile($path, $name, 'text/csv', null, true);
}

test('bulk upload converts windows 1252 csv values to utf 8', function () {
    $batch = createBulkUploadBatch();
    $user = createBulkUploadUser();
    $headers = 'HoldingsID,MaterialType,Title,Subtitle,Abstracts,AgencyCode,JournalTitle,VolumeNo,IssueNo,IssueDate,Author,Subject,BroadClass,URL';
    $utf8Row = 'PCAARRD_TEST,Book,Forest Vines,,"University of the Philippines Los Baños and farmers’ guide.",PCAARRD,Information Bulletin,,No. 1,2026-01-01,Juan dela Cruz,Forestry,Agriculture,test.pdf';
    $windows1252Csv = mb_convert_encoding(
        $headers."\n".$utf8Row."\n",
        'Windows-1252',
        'UTF-8'
    );

    $this->actingAs($user)
        ->post('/bulk-upload', [
            'Type' => 'Book',
            'Contents' => 'Information Bulletin',
            'batch_id' => (string) $batch->id,
            'record_file' => uploadedCsv('records.csv', $windows1252Csv),
            'multimedia_file' => uploadedCsv('media.csv', "HoldingsID,FileName\n"),
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Content saved successfully');

    $approvalRequest = ApprovalRequest::query()
        ->where('HoldingsID', 'PCAARRD_TEST')
        ->firstOrFail();

    expect($approvalRequest->Abstracts)
        ->toBe('University of the Philippines Los Baños and farmers’ guide.')
        ->and(mb_check_encoding($approvalRequest->Abstracts, 'UTF-8'))
        ->toBeTrue();
});

test('bulk upload rejects rows with a different column count', function () {
    $batch = createBulkUploadBatch();
    $user = createBulkUploadUser();

    $this->actingAs($user)
        ->post('/bulk-upload', [
            'Type' => 'Book',
            'Contents' => 'Information Bulletin',
            'batch_id' => (string) $batch->id,
            'record_file' => uploadedCsv(
                'records.csv',
                "HoldingsID,Title,Abstracts\nBROKEN,Only two values\n"
            ),
            'multimedia_file' => uploadedCsv('media.csv', "HoldingsID,FileName\n"),
        ])
        ->assertUnprocessable()
        ->assertJsonPath(
            'errors.record_file.0',
            'CSV row 2 does not match the header column count.'
        );
});
