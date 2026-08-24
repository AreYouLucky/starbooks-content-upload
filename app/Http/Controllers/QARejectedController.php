<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateQualityAssuranceRejectedRequest;
use App\Http\Requests\ViewQARejectedRequestsRequest;
use App\Models\Batch;
use App\Models\LkContent;
use App\Models\Request as ContentRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QARejectedController extends Controller
{
    public function rejectedRequestsPage(ViewQARejectedRequestsRequest $request): Response
    {
        $validated = $request->validated();
        $filters = [
            'quarter' => $validated['quarter'] ?? 'all',
            'year' => $validated['year'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];

        $rejectedRequests = ContentRequest::query()
            ->with([
                'batch',
                'approvalLogs' => fn ($query) => $query
                    ->where('progress_status', 5)
                    ->latest('id')
                    ->limit(1)
                    ->with(['logDetails' => fn ($detailQuery) => $detailQuery->orderBy('id')]),
            ])
            ->where('approval_status', 5)
            ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 5))
            ->whereHas('batch', fn ($query) => $query
                ->where(fn ($batchQuery) => $batchQuery
                    ->where('status', 'for quality approval')
                    ->orWhereNotNull('quality_approval_date')))
            ->when($filters['quarter'] !== 'all', fn ($query) => $query->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('quarter', $filters['quarter'])
            ))
            ->when($filters['year'] !== 'all', fn ($query) => $query->whereHas(
                'batch',
                fn ($batchQuery) => $batchQuery->where('year', $filters['year'])
            ))
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($searchQuery) use ($filters): void {
                    $searchQuery->where('HoldingsID', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Author', 'like', '%'.$filters['search'].'%')
                        ->orWhere('Abstracts', 'like', '%'.$filters['search'].'%');
                });
            });

        $availableBatches = Batch::query()
            ->where(fn ($query) => $query
                ->where('status', 'for quality approval')
                ->orWhereNotNull('quality_approval_date'))
            ->whereHas('approvalRequests', fn ($query) => $query
                ->where('approval_status', 5)
                ->whereHas('approvalLogs', fn ($logQuery) => $logQuery->where('progress_status', 5)));

        return Inertia::render('qa-rejected/rejected-requests-list', [
            'approval_requests' => $rejectedRequests
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => $filters,
            'quarters' => (clone $availableBatches)->whereNotNull('quarter')->distinct()->orderBy('quarter')->pluck('quarter'),
            'years' => (clone $availableBatches)->whereNotNull('year')->distinct()->orderByDesc('year')->pluck('year'),
        ]);
    }

    public function editRejectedRequest(string $id): Response
    {
        $approvalRequest = $this->assignedRejectedRequest($id)
            ->firstOrFail();

        return Inertia::render('shortlisted/partials/single-upload-form', [
            'content_group' => LkContent::query()->get(),
            'batches' => Batch::query()->latest()->get(),
            'approval_request' => $approvalRequest,
            'update_url' => "/quality-assurance-rejected/{$approvalRequest->id}",
            'form_title' => 'Edit QA Rejected Request',
            'form_breadcrumbs' => [
                ['title' => 'Dashboard', 'href' => '/dashboard'],
                ['title' => 'QA Rejected', 'href' => '/quality-assurance-rejected'],
                ['title' => 'Edit Request', 'href' => "/quality-assurance-rejected/{$approvalRequest->id}/edit"],
            ],
        ]);
    }

    public function forwardRejectedRequestToQualityAssurance(
        string $id,
    ): JsonResponse {
        DB::transaction(function () use ($id): void {
            $approvalRequest = $this->assignedRejectedRequest($id)
                ->lockForUpdate()
                ->firstOrFail();

            $approvalRequest->update(['approval_status' => 2]);
        });

        return response()->json([
            'message' => 'Request successfully forwarded to Quality Assurance.',
        ]);
    }

    public function updateRejectedRequest(
        UpdateQualityAssuranceRejectedRequest $request,
        string $id,
    ): JsonResponse {
        $approvalRequest = $this->assignedRejectedRequest($id)
            ->firstOrFail();

        $approvalRequest->update($request->safe()->only([
            'Title',
            'Author',
            'HoldingsID',
            'Contents',
            'MaterialType',
            'JournalTitle',
            'Subject',
            'SubTitle',
            'VolumeNo',
            'IssueNo',
            'IssueDate',
            'BroadClass',
            'AgencyCode',
            'Type',
            'batch_id',
            'Abstracts',
        ]));

        return response()->json([
            'status' => 'QA rejected request successfully updated.',
            'approval_request' => $approvalRequest->fresh(),
        ]);
    }

    private function assignedRejectedRequest(string $id): Builder
    {
        return ContentRequest::query()
            ->whereKey($id)
            ->where('approval_status', 5)
            ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 5));
    }
}
