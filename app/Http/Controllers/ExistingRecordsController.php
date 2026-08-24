<?php

namespace App\Http\Controllers;

use App\Models\ArchivedRecord;
use App\Models\LkContent;
use App\Models\Record;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
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

    public function index(Request $request)
    {
        $validated = $request->validate([
            'content_group' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['all', 'published', 'unpublished'])],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = [
            'content_group' => $validated['content_group'] ?? 'all',
            'status' => $validated['status'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];
        $perPage = $validated['per_page'] ?? 8;

        return Inertia::render('existing-records/existing-records-page', [
            'records' => $this->paginatedRecords($filters, $perPage),
            'contentGroups' => LkContent::query()->orderBy('desc')->get(),
            'filters' => $filters,
            'analytics' => [
                'published' => Record::query()->count(),
                'unpublished' => ArchivedRecord::query()->count(),
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
        $model = $status === 'published' ? new Record : new ArchivedRecord;
        $table = $model->getConnectionName()
            ? $model->getConnectionName().'.'.$model->getTable()
            : $model->getTable();

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
            ArchivedRecord::query()->create($this->transferData($record));
            $record->delete();
        });

        return response()->json(['status' => 'Record Successfully Unpublished']);
    }

    public function republish(int $id): JsonResponse
    {
        $record = ArchivedRecord::query()->findOrFail($id);

        DB::transaction(function () use ($record): void {
            Record::query()->create($this->transferData($record));
            $record->delete();
        });

        return response()->json(['status' => 'Record Successfully Republished']);
    }

    /**
     * @param  array{content_group: string, status: string, search: string}  $filters
     */
    private function paginatedRecords(array $filters, int $perPage): LengthAwarePaginator
    {
        if ($filters['status'] !== 'all') {
            $model = $filters['status'] === 'published' ? new Record : new ArchivedRecord;

            return $this->recordsQueryForModel($model, $filters['status'], $filters)
                ->orderByDesc('id')
                ->paginate($perPage)
                ->withQueryString();
        }

        $publishedQuery = $this->recordsQueryForModel(new Record, 'published', $filters);
        $unpublishedQuery = $this->recordsQueryForModel(new ArchivedRecord, 'unpublished', $filters);
        $page = LengthAwarePaginator::resolveCurrentPage();
        $windowSize = $page * $perPage;
        $total = (clone $publishedQuery)->count() + (clone $unpublishedQuery)->count();

        $records = (clone $publishedQuery)
            ->orderByDesc('id')
            ->limit($windowSize)
            ->get()
            ->concat(
                (clone $unpublishedQuery)
                    ->orderByDesc('id')
                    ->limit($windowSize)
                    ->get()
            )
            ->sort(function (object $left, object $right): int {
                $idComparison = ((int) $right->id) <=> ((int) $left->id);

                return $idComparison !== 0
                    ? $idComparison
                    : strcmp((string) $left->record_status, (string) $right->record_status);
            })
            ->values()
            ->slice(($page - 1) * $perPage, $perPage)
            ->values();

        return (new LengthAwarePaginator(
            $records,
            $total,
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath(), 'pageName' => 'page']
        ))->withQueryString();
    }

    /**
     * @param  array{content_group: string, status: string, search: string}  $filters
     */
    private function recordsQueryForModel(Model $model, string $status, array $filters): QueryBuilder
    {
        $query = $model->newQuery()->toBase();

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
            ->select([
                'id',
                ...$this->recordColumns(),
            ])
            ->selectRaw('? as record_status', [$status]);
    }

    private function findRecord(string $status, int $id): Record|ArchivedRecord
    {
        return $status === 'published'
            ? Record::query()->findOrFail($id)
            : ArchivedRecord::query()->findOrFail($id);
    }

    /**
     * @return array<string, mixed>
     */
    private function transferData(Record|ArchivedRecord $record): array
    {
        return $record->only($this->recordColumns());
    }
}
