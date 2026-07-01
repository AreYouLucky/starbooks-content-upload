<?php

use App\Http\Controllers\PublishedRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::get('/publishing-page', [PublishedRequestController::class, 'publishingPage']);
    Route::get('/publishing-batches', [PublishedRequestController::class, 'publishingBatches']);
    Route::get('/publishing-report-reviewers', [PublishedRequestController::class, 'reportReviewers']);
    Route::get('/generate-publishing-summary-report', [PublishedRequestController::class, 'generatePublishingSummaryReport']);
    Route::get('/generate-publishing-reviewer-report', [PublishedRequestController::class, 'generatePublishingReviewerReport']);
    Route::post('/publish-batch', [PublishedRequestController::class, 'publishBatch']);
});
