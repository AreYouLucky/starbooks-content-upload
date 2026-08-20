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

        $recordQuery = ContentRequest::query()
            ->whereIn('batch_id', (clone $batchQuery)->select('id'));

        $workflow = [
            'total_requests' => (clone $recordQuery)->count(),
            'for_shortlisting' => (clone $recordQuery)->where('approval_status', 0)->count(),
            'for_initial_review' => (clone $recordQuery)->where('approval_status', 1)->count(),
            'for_quality_assurance' => (clone $recordQuery)->where('approval_status', 2)->count(),
            'for_publishing' => (clone $recordQuery)->where('approval_status', 4)->count(),
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
            'request_statuses' => $this->requestStatusCounts($recordQuery),
            'review_decisions' => $reviewDecisions,
            'source_distribution' => $this->sourceDistribution($recordQuery),
            'quarter_trend' => $this->quarterTrend($recordQuery),
            'urgent_contents' => $this->urgentContents($recordQuery),
            'recent_requests' => $this->recentRequests($recordQuery),
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
    private function requestStatusCounts(Builder $recordQuery): array
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
     * @return array<int, array{name: string, value: int}>
     */
    private function sourceDistribution(Builder $recordQuery): array
    {
        return $this->formatCounts(
            (clone $recordQuery)
                ->join('batches', 'batches.id', '=', 'requests.batch_id')
                ->selectRaw('batches.content_source as name, count(requests.id) as value')
                ->groupBy('batches.content_source')
                ->orderByDesc('value')
                ->limit(8)
                ->get()
        );
    }

    /**
     * @return array<int, array{period: string, requests: int, published: int}>
     */
    private function quarterTrend(Builder $recordQuery): array
    {
        return (clone $recordQuery)
            ->join('batches', 'batches.id', '=', 'requests.batch_id')
            ->selectRaw('batches.quarter, batches.year, count(requests.id) as requests_count, sum(case when requests.approval_status = 6 then 1 else 0 end) as published_count')
            ->groupBy('batches.quarter', 'batches.year')
            ->orderBy('batches.year')
            ->orderBy('batches.quarter')
            ->get()
            ->map(fn (ContentRequest $request): array => [
                'period' => $request->quarter.' '.$request->year,
                'requests' => (int) $request->requests_count,
                'published' => (int) $request->published_count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, holdings_id: string|null, title: string|null, content_source: string, quarter: string, year: string, status: string, created_at: string|null}>
     */
    private function recentRequests(Builder $recordQuery): array
    {
        return (clone $recordQuery)
            ->select(['requests.id', 'requests.HoldingsID', 'requests.Title', 'requests.batch_id', 'requests.approval_status', 'requests.created_at'])
            ->with('batch:id,content_source,quarter,year')
            ->latest('requests.created_at')
            ->limit(6)
            ->get()
            ->map(fn (ContentRequest $content): array => [
                'id' => $content->id,
                'holdings_id' => $content->HoldingsID,
                'title' => $content->Title,
                'content_source' => $content->batch->content_source,
                'quarter' => $content->batch->quarter,
                'year' => $content->batch->year,
                'status' => $this->requestStatusLabel($content->approval_status),
                'created_at' => $content->created_at?->toISOString(),
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, holdings_id: string|null, title: string|null, content_source: string, quarter: string, year: string, target_date: string|null, stage: string, days_late: int}>
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

    private function requestStatusLabel(int $approvalStatus): string
    {
        return match ($approvalStatus) {
            0 => 'For Shortlisting',
            1 => 'For Initial Review',
            2 => 'Initial Approved',
            3 => 'Initial Disapproved',
            4 => 'QA Approved',
            5 => 'QA Disapproved',
            6 => 'Published',
            default => 'Unspecified',
        };
    }
}
