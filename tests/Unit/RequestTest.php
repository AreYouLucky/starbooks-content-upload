<?php

use App\Models\Request;

test('request model uses the requests table and initial review fields', function () {
    $request = new Request;

    expect($request->getTable())->toBe('requests')
        ->and($request->getFillable())->toContain('initial_reviewed_date')
        ->and($request->getFillable())->toContain('quality_assurance_date')
        ->and($request->getCasts())
        ->toHaveKey('initial_reviewed_date', 'date')
        ->toHaveKey('quality_assurance_date', 'date');
});
