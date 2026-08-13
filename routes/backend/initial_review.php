<?php

use App\Http\Controllers\InitialReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'initial_review'])->group(function (): void {
    Route::get('/initial-review-page', [InitialReviewController::class, 'initialReviewPage']);
    Route::get('/initial-review-batches', [InitialReviewController::class, 'initialReviewBatches'])->name('view-initial-review-batches');
    Route::get('/view-initial-review-batch/{id}', [InitialReviewController::class, 'viewApprovalRequests'])->name('view-initial-review-batches-by-id');
    Route::get('/initial-review-request/{holdingsID}', [InitialReviewController::class, 'reviewRequest']);
    Route::post('/submit-initial-review', [InitialReviewController::class, 'submitReview']);
    Route::get('/generate-initial-review-report', [InitialReviewController::class, 'generateInitialReviewReport']);
});

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::post('/forward-to-quality-assurance', [InitialReviewController::class, 'forwardToQA']);
});
