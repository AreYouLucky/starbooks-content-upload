<?php

use App\Support\BatchSchedule;

test('it computes non dost milestone dates using monday to thursday working days', function () {
    $schedule = BatchSchedule::fromStartDate('2026-05-12', false);

    expect($schedule['start_date']->toDateString())->toBe('2026-05-12')
        ->and($schedule['target_shortlist_date']->toDateString())->toBe('2026-05-25')
        ->and($schedule['target_initial_review_date']->toDateString())->toBe('2026-06-30')
        ->and($schedule['target_quality_approval_date']->toDateString())->toBe('2026-07-23')
        ->and($schedule['target_published_date']->toDateString())->toBe('2026-08-03');
});

test('it computes dost milestone dates using the accelerated monday to thursday offsets', function () {
    $schedule = BatchSchedule::fromStartDate('2026-05-12', true);

    expect($schedule['start_date']->toDateString())->toBe('2026-05-12')
        ->and($schedule['target_shortlist_date']->toDateString())->toBe('2026-05-25')
        ->and($schedule['target_initial_review_date']->toDateString())->toBe('2026-06-04')
        ->and($schedule['target_quality_approval_date']->toDateString())->toBe('2026-06-04')
        ->and($schedule['target_published_date']->toDateString())->toBe('2026-06-15');
});

test('it allows explicit milestone overrides', function () {
    $schedule = BatchSchedule::fromStartDate('2026-05-12', false, [
        'target_shortlist_date' => '2026-05-25',
        'target_quality_approval_date' => '2026-07-15',
    ]);

    expect($schedule['start_date']->toDateString())->toBe('2026-05-12')
        ->and($schedule['target_shortlist_date']->toDateString())->toBe('2026-05-25')
        ->and($schedule['target_initial_review_date']->toDateString())->toBe('2026-06-30')
        ->and($schedule['target_quality_approval_date']->toDateString())->toBe('2026-07-15')
        ->and($schedule['target_published_date']->toDateString())->toBe('2026-08-03');
});
