<?php

namespace App\Http\Controllers;

use App\Models\ArchiveRecords;
use App\Models\LkContent;
use App\Models\Record;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExistingRecordsController extends Controller
{
    /**
     * @return array<int, string>
     */
    private function recordColumns(): array
    {
        return [
            'HoldingsID',
            'MaterialType',
            'Title',
            'SubTitle',
            'SeriesTitle',
            'BibliographicNote',
            'Contents',
            'Abstracts',
            'JournalTitle',
            'AgencyCode',
            'BroadClass',
            'PhysicalExtension',
            'VolumeNo',
            'IssueNo',
            'IssueDate',
            'Author',
            'AuthorStmt',
            'Type',
            'Subject',
            'Publication',
            'EditDate',
            'date_uploaded',
            'attribution',
            'uploaded_by',
            'url',
        ];
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'content_group' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['all', 'published', 'unpublished'])],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $filters = [
            'content_group' => $validated['content_group'] ?? 'all',
            'status' => $validated['status'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];

        $publishedRecords = $filters['status'] === 'unpublished'
            ? collect()
            : $this->recordsForTable(Record::query(), 'published', $filters);

        $unpublishedRecords = $filters['status'] === 'published'
            ? collect()
            : $this->recordsForTable(ArchiveRecords::query(), 'unpublished', $filters);

        return Inertia::render('existing-records/existing-records-page', [
            'records' => $publishedRecords
                ->concat($unpublishedRecords)
                ->sortByDesc('id')
                ->values(),
            'contentGroups' => LkContent::query()->orderBy('desc')->get(),
            'filters' => $filters,
            'analytics' => [
                'published' => Record::query()->count(),
                'unpublished' => ArchiveRecords::query()->count(),
            ],
        ]);
    }

    
    public function edit(string $status, int $id): Response
    {
        abort_unless(in_array($status, ['published', 'unpublished'], true), 404);

        return Inertia::render('shortlisted/partials/single-upload-form', [
            'content_group' => LkContent::query()->orderBy('desc')->get(),
            'batches' => [],
            'existing_record' => $this->findRecord($status, $id),
            'record_status' => $status,
        ]);
    }

    public function update(Request $request, string $status, int $id): JsonResponse
    {
        abort_unless(in_array($status, ['published', 'unpublished'], true), 404);

        $record = $this->findRecord($status, $id);
        $table = $status === 'published' ? 'tblrecord' : 'tblarchivedrecords';

        $validated = $request->validate([
            'Title' => ['required', 'string', 'max:500', Rule::unique($table, 'Title')->ignore($record->getKey())],
            'Author' => ['required', 'string', 'max:500'],
            'HoldingsID' => ['required', 'string', 'max:255'],
            'Contents' => ['required', 'string', 'max:255'],
            'MaterialType' => ['required', 'string', 'max:255'],
            'JournalTitle' => ['nullable', 'string', 'max:500'],
            'Subject' => ['nullable', 'string'],
            'SubTitle' => ['nullable', 'string', 'max:500'],
            'VolumeNo' => ['nullable', 'string', 'max:255'],
            'IssueNo' => ['nullable', 'string', 'max:255'],
            'IssueDate' => ['nullable', 'string', 'max:255'],
            'BroadClass' => ['nullable', 'string', 'max:255'],
            'AgencyCode' => ['required', 'string', 'max:255'],
            'Type' => ['required', 'string', 'max:255'],
            'Abstracts' => ['required', 'string'],
        ]);

        $record->update($validated);

        return response()->json([
            'status' => 'Record Successfully Updated',
            'record' => $record->refresh(),
        ]);
    }

    public function unpublish(int $id): JsonResponse
    {
        $record = Record::query()->findOrFail($id);

        DB::transaction(function () use ($record): void {
            ArchiveRecords::query()->create($this->transferData($record));
            $record->delete();
        });

        return response()->json(['status' => 'Record Successfully Unpublished']);
    }

    public function republish(int $id): JsonResponse
    {
        $record = ArchiveRecords::query()->findOrFail($id);

        DB::transaction(function () use ($record): void {
            Record::query()->create($this->transferData($record));
            $record->delete();
        });

        return response()->json(['status' => 'Record Successfully Republished']);
    }

    /**
     * @param  array{content_group: string, status: string, search: string}  $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function recordsForTable(Builder $query, string $status, array $filters): Collection
    {
        if ($filters['content_group'] !== 'all') {
            $query->where('Contents', $filters['content_group']);
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->where('Title', 'like', '%'.$search.'%')
                    ->orWhere('Author', 'like', '%'.$search.'%')
                    ->orWhere('HoldingsID', 'like', '%'.$search.'%')
                    ->orWhere('Subject', 'like', '%'.$search.'%');
            });
        }

        return $query
            ->select(['id', ...$this->recordColumns()])
            ->latest('id')
            ->get()
            ->map(fn ($record): array => [
                ...$record->toArray(),
                'record_status' => $status,
            ]);
    }

    private function findRecord(string $status, int $id): Record|ArchiveRecords
    {
        return $status === 'published'
            ? Record::query()->findOrFail($id)
            : ArchiveRecords::query()->findOrFail($id);
    }

    /**
     * @return array<string, mixed>
     */
    private function transferData(Record|ArchiveRecords $record): array
    {
        return $record->only($this->recordColumns());
    }
}
