<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Request as ContentRequest;
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
        $recordQuery = ContentRequest::query()->whereIn('batch_id', $batchIds);

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
            'urgent_contents' => $this->urgentContents($recordQuery),
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
     * @return array<int, array{id: int, holdings_id: string|null, title: string|null, batch_name: string, content_source: string, quarter: string, year: string, target_date: string|null, stage: string, days_late: int}>
     */
    private function urgentContents(Builder $recordQuery): array
    {
        $today = now()->startOfDay();

        return (clone $recordQuery)
            ->join('batches', 'batches.id', '=', 'requests.batch_id')
            ->select(['requests.id', 'requests.HoldingsID', 'requests.Title', 'requests.batch_id', 'requests.approval_status'])
            ->where('requests.is_active', true)
            ->where('batches.is_active', true)
            ->where(function (Builder $query) use ($today): void {
                $query->where(function (Builder $query) use ($today): void {
                    $query->where('requests.approval_status', 0)
                        ->where('batches.status', 'for shortlisting')
                        ->whereDate('batches.target_shortlist_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('requests.approval_status', 1)
                        ->where('batches.status', 'for initial review')
                        ->whereDate('batches.target_initial_review_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('requests.approval_status', 2)
                        ->where('batches.status', 'for quality approval')
                        ->whereDate('batches.target_quality_approval_date', '<', $today);
                })->orWhere(function (Builder $query) use ($today): void {
                    $query->where('requests.approval_status', 4)
                        ->where('batches.status', 'for publishing')
                        ->whereDate('batches.target_published_date', '<', $today);
                });
            })
            ->orderByRaw('CASE requests.approval_status
                WHEN 0 THEN batches.target_shortlist_date
                WHEN 1 THEN batches.target_initial_review_date
                WHEN 2 THEN batches.target_quality_approval_date
                WHEN 4 THEN batches.target_published_date
                END ASC')
            ->limit(8)
            ->with('batch:id,batch_name,content_source,quarter,year,target_shortlist_date,target_initial_review_date,target_quality_approval_date,target_published_date')
            ->get()
            ->map(function (ContentRequest $content) use ($today): array {
                $batch = $content->batch;
                $targetDate = $this->targetDateForStatus($batch, $content->approval_status);
                $target = $targetDate ? Carbon::parse($targetDate)->startOfDay() : null;

                return [
                    'id' => $content->id,
                    'holdings_id' => $content->HoldingsID,
                    'title' => $content->Title,
                    'batch_name' => $batch->batch_name,
                    'content_source' => $batch->content_source,
                    'quarter' => $batch->quarter,
                    'year' => $batch->year,
                    'target_date' => $targetDate,
                    'stage' => $this->stageLabel($content->approval_status),
                    'days_late' => $target ? (int) $target->diffInDays($today) : 0,
                ];
            })
            ->values()
            ->all();
    }

    private function targetDateForStatus(Batch $batch, int $approvalStatus): ?string
    {
        return match ($approvalStatus) {
            0 => $batch->target_shortlist_date,
            1 => $batch->target_initial_review_date,
            2 => $batch->target_quality_approval_date,
            4 => $batch->target_published_date,
            default => null,
        };
    }

    private function stageLabel(int $approvalStatus): string
    {
        return match ($approvalStatus) {
            0 => 'Shortlisting',
            1 => 'Initial Review',
            2 => 'Quality Assurance',
            4 => 'Publishing',
            default => 'Review',
        };
    }
}
