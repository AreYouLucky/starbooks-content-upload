<?php

namespace App\Support;

use Illuminate\Support\Carbon;

final class BatchSchedule
{
    /**
     * @param  array{
     *     target_shortlist_date?: Carbon|string|null,
     *     target_initial_review_date?: Carbon|string|null,
     *     target_quality_approval_date?: Carbon|string|null,
     *     target_published_date?: Carbon|string|null
     * }  $overrides
     * @return array{
     *     start_date: Carbon,
     *     target_shortlist_date: Carbon,
     *     target_initial_review_date: Carbon,
     *     target_quality_approval_date: Carbon,
     *     target_published_date: Carbon
     * }
     */
    public static function fromStartDate(
        Carbon|string $startDate,
        bool $isDost,
        array $overrides = [],
    ): array {
        $date = $startDate instanceof Carbon
            ? $startDate->copy()->startOfDay()
            : Carbon::parse($startDate)->startOfDay();

        $shortlistingDate = self::addWorkingDays($date, 7);
        $initialReviewOffset = $isDost ? 14 : 28;
        $qualityApprovalOffset = $isDost ? 14 : 42;
        $publishedOffset = $isDost ? 19 : 47;

        $schedule = [
            'start_date' => $date,
            'target_shortlist_date' => $shortlistingDate,
            'target_initial_review_date' => self::addWorkingDays($date, $initialReviewOffset),
            'target_quality_approval_date' => self::addWorkingDays($date, $qualityApprovalOffset),
            'target_published_date' => self::addWorkingDays($date, $publishedOffset),
        ];

        foreach ([
            'target_shortlist_date',
            'target_initial_review_date',
            'target_quality_approval_date',
            'target_published_date',
        ] as $field) {
            $override = $overrides[$field] ?? null;

            if ($override === null || $override === '') {
                continue;
            }

            $schedule[$field] = $override instanceof Carbon
                ? $override->copy()->startOfDay()
                : Carbon::parse($override)->startOfDay();
        }

        return $schedule;
    }

    private static function addWorkingDays(Carbon $startDate, int $workingDays): Carbon
    {
        $nextDate = $startDate->copy()->startOfDay();
        $addedWorkingDays = 0;

        while ($addedWorkingDays < $workingDays) {
            $nextDate->addDay();

            if (in_array($nextDate->dayOfWeek, [Carbon::SUNDAY, Carbon::FRIDAY, Carbon::SATURDAY], true)) {
                continue;
            }

            $addedWorkingDays++;
        }

        return $nextDate;
    }
}
