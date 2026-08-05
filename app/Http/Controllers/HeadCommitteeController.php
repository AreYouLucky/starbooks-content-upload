<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateApprovalRequestAssignmentRequest;
use App\Http\Requests\ViewRequestAssignmentsRequest;
use App\Models\ApprovalRequest;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class HeadCommitteeController extends Controller
{
    public function viewRequestAssignmentPage(ViewRequestAssignmentsRequest $request): Response
    {
        $validated = $request->validated();
        $filters = [
            'quarter' => $validated['quarter'] ?? 'all',
            'year' => $validated['year'] ?? 'all',
            'search' => $validated['search'] ?? '',
        ];

        $approvalRequests = ApprovalRequest::query()
            ->select([
                'id', 'Title', 'MaterialType', 'HoldingsID', 'Author', 'Abstracts', 'Contents', 'Type',
                'approval_status', 'batch_id', 'committee_reviewer_id', 'quality_assurance_reviewer_id',
            ])
            ->with([
                'batch:id,batch_name,batch_description,quarter,year,is_dost',
                'committeeReviewer:id,full_name,role',
                'qualityAssuranceReviewer:id,full_name,role',
            ])
            ->whereIn('approval_status', [1, 2])
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
                        ->orWhereHas('batch', fn ($batchQuery) => $batchQuery
                            ->where('batch_name', 'like', '%'.$filters['search'].'%'));
                });
            });

        $totalRequests = (clone $approvalRequests)->count();
        $assignedRequests = (clone $approvalRequests)
            ->where(function ($query): void {
                $query->where(function ($dostQuery): void {
                    $dostQuery->whereNotNull('quality_assurance_reviewer_id')
                        ->whereHas('batch', fn ($batchQuery) => $batchQuery->where('is_dost', 1));
                })->orWhere(function ($nonDostQuery): void {
                    $nonDostQuery->whereNotNull('committee_reviewer_id')
                        ->whereNotNull('quality_assurance_reviewer_id')
                        ->whereHas('batch', fn ($batchQuery) => $batchQuery->where('is_dost', 0));
                });
            })
            ->count();

        $paginatedApprovalRequests = $approvalRequests
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $availableBatches = Batch::query()
            ->whereHas('approvalRequests', fn ($query) => $query->whereIn('approval_status', [1, 2]));

        $committeeReviewers = User::query()
            ->select('id', 'full_name', 'role')
            ->whereIn('role', ['committee', 'head_committee'])
            ->orderBy('full_name')
            ->get();

        $qualityAssuranceReviewers = User::query()
            ->select('id', 'full_name', 'role')
            ->where('role', 'quality')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('head-committee/requests-list', [
            'approval_requests' => $paginatedApprovalRequests,
            'committee_reviewers' => $committeeReviewers,
            'quality_assurance_reviewers' => $qualityAssuranceReviewers,
            'filters' => $filters,
            'quarters' => (clone $availableBatches)->whereNotNull('quarter')->distinct()->orderBy('quarter')->pluck('quarter'),
            'years' => (clone $availableBatches)->whereNotNull('year')->distinct()->orderByDesc('year')->pluck('year'),
            'analytics' => [
                'assigned' => $assignedRequests,
                'unassigned' => $totalRequests - $assignedRequests,
            ],
        ]);
    }

    public function updateRequestAssignment(UpdateApprovalRequestAssignmentRequest $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $approvalRequest->load('batch:id,is_dost');

        if ($approvalRequest->batch?->is_dost && $approvalRequest->batch?->status == 'for quality approval') {
            return response()->json(['message' => 'DOST batch assignments cannot be changed.'], 422);
        }

        $approvalRequest->update($request->validated());

        return response()->json(['message' => 'Reviewers assigned successfully.']);
    }
}
