<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\Batch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard/dashboard-page');
    }

    public function data(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scope' => ['required', 'string', Rule::in(['all', 'filtered'])],
            'quarter' => ['required_if:scope,filtered', 'nullable', 'string', 'max:50'],
            'year' => ['required_if:scope,filtered', 'nullable', 'string', 'max:50'],
        ]);

        $batchQuery = Batch::query();

        if ($validated['scope'] === 'filtered') {
            $batchQuery
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']);
        }

        $batchIds = (clone $batchQuery)->pluck('id');
        $recordQuery = ApprovalRequest::query()->whereIn('batch_id', $batchIds);

        $workflow = [
            'batches' => (clone $batchQuery)->count(),
            'records' => (clone $recordQuery)->count(),
            'shortlisted' => (clone $recordQuery)->where('approval_status', '>=', 1)->count(),
            'initial_reviewed' => (clone $recordQuery)
                ->whereHas('approvalLogs', fn ($query) => $query->whereIn('progress_status', [2, 3]))
                ->count(),
            'quality_reviewed' => (clone $recordQuery)
                ->whereHas('approvalLogs', fn ($query) => $query->whereIn('progress_status', [4, 5]))
                ->count(),
            'published' => (clone $recordQuery)->where('approval_status', 6)->count(),
        ];

        $reviewDecisions = [
            [
                'name' => 'Initial Approved',
                'value' => (clone $recordQuery)
                    ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 2))
                    ->count(),
            ],
            [
                'name' => 'Initial Disapproved',
                'value' => (clone $recordQuery)
                    ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 3))
                    ->count(),
            ],
            [
                'name' => 'QA Approved',
                'value' => (clone $recordQuery)
                    ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 4))
                    ->count(),
            ],
            [
                'name' => 'QA Disapproved',
                'value' => (clone $recordQuery)
                    ->whereHas('approvalLogs', fn ($query) => $query->where('progress_status', 5))
                    ->count(),
            ],
        ];

        return response()->json([
            'summary' => $workflow,
            'batch_statuses' => $this->formatCounts(
                (clone $batchQuery)
                    ->selectRaw('status as name, count(*) as value')
                    ->groupBy('status')
                    ->orderBy('status')
                    ->get()
            ),
            'record_statuses' => $this->recordStatusCounts($recordQuery),
            'review_decisions' => $reviewDecisions,
            'source_distribution' => $this->formatCounts(
                (clone $batchQuery)
                    ->selectRaw('content_source as name, count(*) as value')
                    ->groupBy('content_source')
                    ->orderByDesc('value')
                    ->limit(8)
                    ->get()
            ),
            'quarter_trend' => $this->quarterTrend($batchQuery),
            'urgent_batches' => $this->urgentBatches($batchQuery),
            'recent_batches' => (clone $batchQuery)
                ->select('id', 'batch_name', 'content_source', 'quarter', 'year', 'status', 'created_at')
                ->withCount('approvalRequests as records_count')
                ->latest()
                ->limit(6)
                ->get(),
        ]);
    }

    /**
     * @param  Collection<int, object{name: string|null, value: int}>  $counts
     * @return array<int, array{name: string, value: int}>
     */
    private function formatCounts(Collection $counts): array
    {
        return $counts
            ->map(fn (object $item): array => [
                'name' => $item->name ?: 'Unspecified',
                'value' => (int) $item->value,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{name: string, value: int}>
     */
    private function recordStatusCounts(Builder $recordQuery): array
    {
        $statusLabels = [
            0 => 'For Shortlisting',
            1 => 'For Initial Review',
            2 => 'Initial Approved',
            3 => 'Initial Disapproved',
            4 => 'QA Approved',
            5 => 'QA Disapproved',
            6 => 'Published',
        ];

        return collect($statusLabels)
            ->map(fn (string $label, int $status): array => [
                'name' => $label,
                'value' => (clone $recordQuery)->where('approval_status', $status)->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{period: string, batches: int, records: int, published: int}>
     */
    private function quarterTrend(Builder $batchQuery): array
    {
        return (clone $batchQuery)
            ->select('id', 'quarter', 'year')
            ->withCount([
                'approvalRequests as records_count',
                'approvalRequests as published_count' => fn ($query) => $query->where('approval_status', 6),
            ])
            ->orderBy('year')
            ->orderBy('quarter')
            ->get()
            ->groupBy(fn (Batch $batch): string => $batch->quarter.' '.$batch->year)
            ->map(fn (Collection $batches, string $period): array => [
                'period' => $period,
                'batches' => $batches->count(),
                'records' => (int) $batches->sum('records_count'),
                'published' => (int) $batches->sum('published_count'),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, batch_name: string, content_source: string, quarter: string, year: string, status: string|null, target_date: string|null, stage: string, days_late: int, records_count: int}>
     */
    private function urgentBatches(Builder $batchQuery): array
    {
        $today = now()->startOfDay();

        return (clone $batchQuery)
            ->select([
                'id',
                'batch_name',
                'content_source',
                'quarter',
                'year',
                'status',
                'target_shortlist_date',
                'target_initial_review_date',
                'target_quality_approval_date',
                'target_published_date',
            ])
            ->where(function (Builder $query) use ($today): void {
                $query->where(function (Builder $query) use ($today): void {
                    $query->where('status', 'for shortlisting')
                        ->whereDate('target_shortlist_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('status', 'for initial review')
                        ->whereDate('target_initial_review_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('status', 'for quality approval')
                        ->whereDate('target_quality_approval_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('status', 'for publishing')
                        ->whereDate('target_published_date', '<', $today);
                });
            })
            ->withCount('approvalRequests as records_count')
            ->get()
            ->map(function (Batch $batch) use ($today): array {
                $targetDate = $this->targetDateForStatus($batch);
                $target = $targetDate ? Carbon::parse($targetDate)->startOfDay() : null;

                return [
                    'id' => $batch->id,
                    'batch_name' => $batch->batch_name,
                    'content_source' => $batch->content_source,
                    'quarter' => $batch->quarter,
                    'year' => $batch->year,
                    'status' => $batch->status,
                    'target_date' => $targetDate,
                    'stage' => $this->stageLabel($batch->status),
                    'days_late' => $target ? (int) $target->diffInDays($today) : 0,
                    'records_count' => (int) $batch->records_count,
                ];
            })
            ->sortByDesc('days_late')
            ->take(8)
            ->values()
            ->all();
    }

    private function targetDateForStatus(Batch $batch): ?string
    {
        return match ($batch->status) {
            'for shortlisting' => $batch->target_shortlist_date,
            'for initial review' => $batch->target_initial_review_date,
            'for quality approval' => $batch->target_quality_approval_date,
            'for publishing' => $batch->target_published_date,
            default => null,
        };
    }

    private function stageLabel(?string $status): string
    {
        return match ($status) {
            'for shortlisting' => 'Shortlisting',
            'for initial review' => 'Initial Review',
            'for quality approval' => 'Quality Assurance',
            'for publishing' => 'Publishing',
            default => 'Review',
        };
    }
}
