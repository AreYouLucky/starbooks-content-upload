<?php

namespace App\Http\Controllers;

use App\Http\Requests\ViewWorkflowReportRequest;
use App\Models\Log;
use App\Models\Request as ContentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowReportController extends Controller
{
    private const SECTION_ROLES = [
        'shortlisted' => ['stii_admin', 'admin', 'super_admin'],
        'initial-review' => ['committee', 'admin', 'super_admin'],
        'quality-assurance' => ['quality', 'quality_admin', 'admin', 'super_admin'],
        'publishing' => ['stii_admin', 'admin', 'super_admin'],
    ];

    private const SECTION_LABELS = [
        'shortlisted' => 'Shortlisted',
        'initial-review' => 'Initial Review',
        'quality-assurance' => 'Quality Assurance',
        'publishing' => 'Publishing',
    ];

    public function page(Request $request, string $section): Response
    {
        $this->authorizeSection($request, $section);
        $canSelectReviewer = in_array($request->user()->role, ['admin', 'super_admin'], true);

        return Inertia::render('reports/report-page', [
            'report_section' => $section,
            'section_label' => self::SECTION_LABELS[$section],
            'can_select_reviewer' => $canSelectReviewer && in_array($section, ['initial-review', 'quality-assurance'], true),
            'reviewers' => $canSelectReviewer ? $this->reviewersFor($section) : [],
        ]);
    }

    public function data(ViewWorkflowReportRequest $request, string $section): JsonResponse
    {
        $validated = $request->validated();

        $report = match ($section) {
            'shortlisted' => $this->shortlistedReport($validated['quarter'], $validated['year']),
            'initial-review' => $this->initialReviewReport($request, $validated),
            'quality-assurance' => $this->qualityAssuranceReport($request, $validated),
            'publishing' => $this->publishingReport($validated['quarter'], $validated['year']),
        };

        return response()->json([
            ...$report,
            'filters' => [
                'quarter' => $validated['quarter'],
                'year' => $validated['year'],
                'reviewer_id' => $validated['reviewer_id'] ?? null,
            ],
        ]);
    }

    private function authorizeSection(Request $request, string $section): void
    {
        abort_unless(
            isset(self::SECTION_ROLES[$section])
                && in_array($request->user()?->role, self::SECTION_ROLES[$section], true),
            403
        );
    }

    /**
     * @return Collection<int, array{id: int, full_name: string}>
     */
    private function reviewersFor(string $section): Collection
    {
        $roles = match ($section) {
            'initial-review' => ['committee', 'head_committee'],
            'quality-assurance' => ['quality', 'quality_admin'],
            default => [],
        };

        if ($roles === []) {
            return collect();
        }

        return User::query()
            ->select('id', 'full_name')
            ->whereIn('role', $roles)
            ->orderBy('full_name')
            ->get();
    }

    /**
     * @return array{title: string, columns: array<int, array{key: string, label: string}>, rows: Collection<int, array<string, mixed>>}
     */
    private function shortlistedReport(string $quarter, string $year): array
    {
        $requests = ContentRequest::query()
            ->select([
                'id', 'HoldingsID', 'MaterialType', 'Title', 'AgencyCode',
                'JournalTitle', 'Abstracts', 'Author', 'VolumeNo', 'IssueNo',
                'IssueDate', 'batch_id',
            ])
            ->where('is_active', 1)
            ->whereHas('batch', fn (Builder $query) => $query
                ->where('is_active', 1)
                ->where('quarter', $quarter)
                ->where('year', $year))
            ->with('batch:id,batch_name,content_source')
            ->orderBy('Title')
            ->get();

        return [
            'title' => 'STARBOOKS Shortlisted / Partial Content Report',
            'columns' => $this->columns([
                'holdings_id' => 'Holdings ID',
                'content_type' => 'Content Type',
                'title' => 'Title',
                'source' => 'Source',
                'journal_title' => 'Journal Title',
                'abstract' => 'Abstract',
                'author' => 'Author',
                'volume_no' => 'Volume No.',
                'issue_no' => 'Issue No.',
                'issue_date' => 'Issue Date',
            ]),
            'rows' => $requests->map(fn (ContentRequest $content) => [
                'holdings_id' => $content->HoldingsID,
                'content_type' => $content->MaterialType,
                'title' => $content->Title,
                'source' => $content->AgencyCode ?: $content->batch?->content_source,
                'journal_title' => $content->JournalTitle,
                'abstract' => $content->Abstracts,
                'author' => $content->Author,
                'volume_no' => $content->VolumeNo,
                'issue_no' => $content->IssueNo,
                'issue_date' => $content->IssueDate,
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{title: string, columns: array<int, array{key: string, label: string}>, rows: Collection<int, array<string, mixed>>, summary: array{label: string, timeliness: string, total_score: int, scored_records: int, average_score: float|null}}
     */
    private function initialReviewReport(Request $request, array $validated): array
    {
        $reviewerId = $this->reviewerIdFor($request, $validated, ['committee', 'head_committee']);
        $logFilter = fn ($query) => $query
            ->whereIn('progress_status', [2, 3])
            ->when($reviewerId !== null, fn ($query) => $query->where('user_id', $reviewerId));

        $contents = ContentRequest::query()
            ->where('is_active', 1)
            ->whereHas('batch', fn (Builder $query) => $query
                ->where('is_active', 1)
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->when($reviewerId !== null, fn (Builder $query) => $query->where('initial_reviewer_id', $reviewerId))
            ->whereHas('approvalLogs', $logFilter)
            ->with([
                'batch:id,batch_name,content_source,target_initial_review_date',
                'approvalLogs' => fn ($query) => $logFilter($query)
                    ->oldest('created_at')
                    ->oldest('id')
                    ->limit(1)
                    ->with(['reviewer:id,full_name']),
            ])
            ->orderBy('Title')
            ->get();

        return $this->reviewReport(
            'STARBOOKS Initial Review Report',
            $contents,
            fn (ContentRequest $content, Log $log) => $content->initial_reviewed_assigned_date?->toISOString(),
            fn (ContentRequest $content) => $content->batch?->target_initial_review_date
        );
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{title: string, columns: array<int, array{key: string, label: string}>, rows: Collection<int, array<string, mixed>>}
     */
    private function qualityAssuranceReport(Request $request, array $validated): array
    {
        $reviewerId = $this->reviewerIdFor($request, $validated, ['quality', 'quality_admin']);

        $contents = ContentRequest::query()
            ->where('is_active', 1)
            ->whereHas('batch', fn (Builder $query) => $query
                ->where('is_active', 1)
                ->where('quarter', $validated['quarter'])
                ->where('year', $validated['year']))
            ->when($reviewerId !== null, fn (Builder $query) => $query->where('quality_assurance_reviewer_id', $reviewerId))
            ->whereHas('approvalLogs', fn (Builder $query) => $query
                ->whereIn('progress_status', [4, 5])
                ->when($reviewerId !== null, fn (Builder $query) => $query->where('user_id', $reviewerId)))
            ->with([
                'batch:id,batch_name,content_source,target_quality_approval_date,is_dost',
                'approvalLogs' => fn ($query) => $query
                    ->whereIn('progress_status', [2, 4, 5])
                    ->orderBy('created_at')
                    ->orderBy('id')
                    ->with(['reviewer:id,full_name']),
            ])
            ->orderBy('Title')
            ->get();

        $contents->each(function (ContentRequest $content) use ($reviewerId): void {
            $forwardedAt = (bool) $content->batch?->is_dost
                ? $content->quality_assurance_assigned_date?->toISOString()
                : $content->approvalLogs
                    ->where('progress_status', 2)
                    ->first()?->created_at?->toISOString();
            $qualityLog = $content->approvalLogs
                ->whereIn('progress_status', [4, 5])
                ->when($reviewerId !== null, fn (Collection $logs) => $logs->where('user_id', $reviewerId))
                ->first();

            $content->setAttribute('report_forwarded_at', $forwardedAt);
            $content->setRelation('approvalLogs', collect($qualityLog ? [$qualityLog] : []));
        });

        return $this->reviewReport(
            'STARBOOKS Quality Assurance Report',
            $contents,
            fn (ContentRequest $content, Log $log) => $content->getAttribute('report_forwarded_at'),
            fn (ContentRequest $content) => $content->batch?->target_quality_approval_date
        );
    }

    /**
     * @return array{title: string, columns: array<int, array{key: string, label: string}>, rows: Collection<int, array<string, mixed>>}
     */
    private function publishingReport(string $quarter, string $year): array
    {
        $contents = ContentRequest::query()
            ->where('is_active', 1)
            ->where('approval_status', 6)
            ->whereHas('batch', fn (Builder $query) => $query
                ->where('is_active', 1)
                ->where('quarter', $quarter)
                ->where('year', $year))
            ->with('batch:id,batch_name,content_source')
            ->orderBy('Title')
            ->get();

        return [
            'title' => 'STARBOOKS Published Content Report',
            'columns' => $this->columns([
                'title' => 'Content Title',
                'holdings_id' => 'Holdings ID',
                'batch_name' => 'Batch Name',
                'content_source' => 'Content Source',
                'author' => 'Author',
                'material_type' => 'Material Type',
                'publishing_status' => 'Publishing Status',
                'published_at' => 'Published Date',
            ]),
            'rows' => $contents->map(fn (ContentRequest $content) => [
                'title' => $content->Title,
                'holdings_id' => $content->HoldingsID,
                'batch_name' => $content->batch?->batch_name,
                'content_source' => $content->batch?->content_source,
                'author' => $content->Author,
                'material_type' => $content->MaterialType,
                'publishing_status' => 'Published',
                'published_at' => $content->published_at?->toISOString(),
            ]),
        ];
    }

    /**
     * @param  Collection<int, ContentRequest>  $contents
     * @param  callable(ContentRequest, Log): ?string  $forwardedDate
     * @param  callable(ContentRequest): ?string  $deadline
     * @return array{title: string, columns: array<int, array{key: string, label: string}>, rows: Collection<int, array<string, mixed>>, summary: array{label: string, timeliness: string, total_score: int, scored_records: int, average_score: float|null}}
     */
    private function reviewReport(
        string $title,
        Collection $contents,
        callable $forwardedDate,
        callable $deadline,
    ): array {
        $rows = $contents->map(function (ContentRequest $content) use ($forwardedDate, $deadline): array {
            /** @var Log|null $log */
            $log = $content->approvalLogs->first();
            $targetDeadline = $deadline($content);
            $timeliness = $this->timeliness($log?->created_at, $targetDeadline);

            return [
                'batch_name' => $content->batch?->batch_name,
                'content_source' => $content->batch?->content_source,
                'title' => $content->Title,
                'holdings_id' => $content->HoldingsID,
                'reviewer_name' => $log?->reviewer?->full_name,
                'date_forwarded' => $log ? $forwardedDate($content, $log) : null,
                'target_deadline' => $targetDeadline,
                'review_date' => $log?->created_at?->toISOString(),
                'timeliness' => $timeliness['label'],
                'score' => $timeliness['score'],
            ];
        });

        return [
            'title' => $title,
            'columns' => $this->columns([
                'batch_name' => 'Batch Name',
                'content_source' => 'Content Source',
                'title' => 'Content Title',
                'holdings_id' => 'Holdings ID',
                'reviewer_name' => 'Reviewer',
                'date_forwarded' => 'Date Forwarded',
                'target_deadline' => 'Target Deadline',
                'review_date' => 'Review Date',
                'timeliness' => 'Timeliness',
                'score' => 'Score',
            ]),
            'rows' => $rows,
            'summary' => $this->averageSummary($rows),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array{label: string, timeliness: string, total_score: int, scored_records: int, average_score: float|null}
     */
    private function averageSummary(Collection $rows): array
    {
        $scores = $rows->pluck('score')->filter(fn (mixed $score): bool => is_numeric($score));
        $count = $scores->count();
        $total = (int) $scores->sum();
        $average = $count > 0 ? $total / $count : null;

        return [
            'label' => 'Total Average',
            'timeliness' => match (true) {
                $average === null => '',
                $average >= 5 => 'BTD',
                $average >= 3 => 'OTD',
                default => 'ATD',
            },
            'total_score' => $total,
            'scored_records' => $count,
            'average_score' => $average,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  array<int, string>  $reviewerRoles
     */
    private function reviewerIdFor(Request $request, array $validated, array $reviewerRoles): ?int
    {
        if (! in_array($request->user()->role, ['admin', 'super_admin'], true)) {
            abort_if(
                isset($validated['reviewer_id'])
                    && (int) $validated['reviewer_id'] !== $request->user()->id,
                403
            );

            return $request->user()->id;
        }

        $reviewerId = isset($validated['reviewer_id']) ? (int) $validated['reviewer_id'] : null;

        if ($reviewerId !== null && ! User::query()->whereKey($reviewerId)->whereIn('role', $reviewerRoles)->exists()) {
            throw ValidationException::withMessages([
                'reviewer_id' => 'The selected reviewer is not valid for this report.',
            ]);
        }

        return $reviewerId;
    }

    /**
     * @return array{label: string, score: int|null}
     */
    private function timeliness(mixed $reviewDate, mixed $targetDeadline): array
    {
        if ($reviewDate === null || $targetDeadline === null) {
            return ['label' => '', 'score' => null];
        }

        $reviewed = Carbon::parse($reviewDate)->startOfDay();
        $deadline = Carbon::parse($targetDeadline)->startOfDay();

        if ($reviewed->lt($deadline)) {
            return ['label' => 'BTD', 'score' => 5];
        }

        if ($reviewed->equalTo($deadline)) {
            return ['label' => 'OTD', 'score' => 3];
        }

        return ['label' => 'ATD', 'score' => 1];
    }

    /**
     * @param  array<string, string>  $columns
     * @return array<int, array{key: string, label: string}>
     */
    private function columns(array $columns): array
    {
        return collect($columns)
            ->map(fn (string $label, string $key) => compact('key', 'label'))
            ->values()
            ->all();
    }
}
