<?php

use App\Http\Controllers\CommitteeReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'committee'])->group(function () {
    Route::get('/committee-review-page', [CommitteeReviewController::class, 'committeeReviewPage']);
    Route::get('/committee-review-batches', [CommitteeReviewController::class, 'CommitteeReviewBatches'])->name('view-committee-review-batches');
    Route::get('/view-committee-review-batch/{id}', [CommitteeReviewController::class, 'viewApprovalRequests'])->name('view-committee-review-batches');
    Route::get('/committee-review-request/{holdingsID}', [CommitteeReviewController::class, 'ReviewRequest']);
});
