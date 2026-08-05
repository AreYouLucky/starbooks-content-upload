<?php

use App\Http\Controllers\HeadCommitteeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'head_committee'])->group(function (): void {
    Route::get('/view-assignment-designation', [HeadCommitteeController::class, 'viewRequestAssignmentPage'])
        ->name('head-committee.request-assignments');
    Route::patch('/approval-requests/{approvalRequest}/assignments', [HeadCommitteeController::class, 'updateRequestAssignment'])
        ->name('head-committee.approval-requests.assignments');
});
