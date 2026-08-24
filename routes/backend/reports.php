<?php

use App\Http\Controllers\WorkflowReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function (): void {
    Route::get('/reports/{section}', [WorkflowReportController::class, 'page']);
    Route::get('/reports/{section}/data', [WorkflowReportController::class, 'data']);
});
