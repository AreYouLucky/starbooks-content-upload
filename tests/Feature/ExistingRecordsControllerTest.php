<?php

use App\Models\ArchiveRecords;
use App\Models\Record;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['tblrecord', 'tblarchivedrecords'] as $tableName) {
        if (! Schema::hasTable($tableName)) {
            Schema::create($tableName, function (Blueprint $table): void {
                $table->id();
                $table->string('HoldingsID')->nullable();
                $table->string('MaterialType')->nullable();
                $table->string('Title')->nullable();
                $table->string('SubTitle')->nullable();
                $table->string('SeriesTitle')->nullable();
                $table->text('BibliographicNote')->nullable();
                $table->string('Contents')->nullable();
                $table->text('Abstracts')->nullable();
                $table->string('JournalTitle')->nullable();
                $table->string('AgencyCode')->nullable();
                $table->string('BroadClass')->nullable();
                $table->string('PhysicalExtension')->nullable();
                $table->string('VolumeNo')->nullable();
                $table->string('IssueNo')->nullable();
                $table->string('IssueDate')->nullable();
                $table->string('Author')->nullable();
                $table->string('AuthorStmt')->nullable();
                $table->string('Type')->nullable();
                $table->string('Subject')->nullable();
                $table->string('Publication')->nullable();
                $table->string('EditDate')->nullable();
                $table->string('date_uploaded')->nullable();
                $table->string('attribution')->nullable();
                $table->unsignedBigInteger('uploaded_by')->nullable();
                $table->string('url')->nullable();
            });
        }
    }

    if (! Schema::hasTable('lk_contents')) {
        Schema::create('lk_contents', function (Blueprint $table): void {
            $table->id();
            $table->string('code');
            $table->string('desc');
            $table->string('vol')->nullable();
            $table->string('issue')->nullable();
        });
    }
});

function createExistingRecordsUser(): User
{
    return User::query()->create([
        'username' => 'existing_'.Str::lower(Str::random(8)),
        'full_name' => 'Existing Records User '.Str::random(6),
        'delivery_unit' => 'Publishing',
        'role' => 'stii_admin',
        'designation' => 'Publisher',
        'task_description' => 'Existing records test',
        'password' => Hash::make('password'),
    ]);
}

function existingRecordPayload(array $attributes = []): array
{
    return array_merge([
        'HoldingsID' => 'EXIST-'.Str::upper(Str::random(6)),
        'MaterialType' => 'Article',
        'Title' => 'Existing Record '.Str::upper(Str::random(5)),
        'Contents' => 'SCI',
        'Abstracts' => 'A published record abstract.',
        'AgencyCode' => 'DOST',
        'Author' => 'DOST-STII',
        'Type' => '1',
        'Subject' => 'Science',
    ], $attributes);
}

test('existing records page lists published and unpublished records with filters', function () {
    Record::query()->create(existingRecordPayload([
        'Title' => 'Published Science Record',
        'Contents' => 'SCI',
    ]));
    ArchiveRecords::query()->create(existingRecordPayload([
        'Title' => 'Archived Health Record',
        'Contents' => 'HLT',
    ]));

    $this->actingAs(createExistingRecordsUser())
        ->get('/existing-records?status=published&content_group=SCI')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('existing-records/existing-records-page')
            ->has('records.data', 1)
            ->where('records.data.0.Title', 'Published Science Record')
            ->where('records.data.0.record_status', 'published')
            ->where('records.total', 1)
            ->where('analytics.published', 1)
            ->where('analytics.unpublished', 1));
});

test('existing records page paginates records on the backend', function () {
    foreach (range(1, 10) as $number) {
        Record::query()->create(existingRecordPayload([
            'Title' => sprintf('Paginated Existing Record %02d', $number),
            'Contents' => 'SCI',
        ]));
    }

    $this->actingAs(createExistingRecordsUser())
        ->get('/existing-records?status=published&content_group=SCI')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('existing-records/existing-records-page')
            ->has('records.data', 8)
            ->where('records.current_page', 1)
            ->where('records.last_page', 2)
            ->where('records.per_page', 8)
            ->where('records.total', 10)
            ->where('records.data.0.Title', 'Paginated Existing Record 10'));

    $this->actingAs(createExistingRecordsUser())
        ->get('/existing-records?status=published&content_group=SCI&page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('existing-records/existing-records-page')
            ->has('records.data', 2)
            ->where('records.current_page', 2)
            ->where('records.total', 10));
});

test('published records can be unpublished and republished', function () {
    $record = Record::query()->create(existingRecordPayload([
        'HoldingsID' => 'MOVE-001',
        'Title' => 'Movable Existing Record',
    ]));

    $this->actingAs(createExistingRecordsUser())
        ->postJson("/existing-records/{$record->id}/unpublish")
        ->assertOk()
        ->assertJsonPath('status', 'Record Successfully Unpublished');

    $this->assertDatabaseMissing('tblrecord', [
        'HoldingsID' => 'MOVE-001',
    ]);
    $this->assertDatabaseHas('tblarchivedrecords', [
        'HoldingsID' => 'MOVE-001',
        'Title' => 'Movable Existing Record',
    ]);

    $archivedRecord = ArchiveRecords::query()
        ->where('HoldingsID', 'MOVE-001')
        ->firstOrFail();

    $this->actingAs(createExistingRecordsUser())
        ->postJson("/archived-records/{$archivedRecord->id}/republish")
        ->assertOk()
        ->assertJsonPath('status', 'Record Successfully Republished');

    $this->assertDatabaseHas('tblrecord', [
        'HoldingsID' => 'MOVE-001',
        'Title' => 'Movable Existing Record',
    ]);
    $this->assertDatabaseMissing('tblarchivedrecords', [
        'HoldingsID' => 'MOVE-001',
    ]);
});

test('existing records can be updated from the edit form route', function () {
    $record = Record::query()->create(existingRecordPayload([
        'Title' => 'Before Update',
    ]));

    $this->actingAs(createExistingRecordsUser())
        ->postJson("/existing-records/published/{$record->id}", existingRecordPayload([
            'Title' => 'After Update',
            'HoldingsID' => $record->HoldingsID,
            'Author' => 'Updated Author',
        ]))
        ->assertOk()
        ->assertJsonPath('status', 'Record Successfully Updated');

    $this->assertDatabaseHas('tblrecord', [
        'id' => $record->id,
        'Title' => 'After Update',
        'Author' => 'Updated Author',
    ]);
});
