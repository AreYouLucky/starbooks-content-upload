<?php

use App\Http\Controllers\CommitteeReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'committee'])->group(function () {
    Route::resource('/committee-review', CommitteeReviewController::class);
    Route::get('/view-committee-review-batches', [CommitteeReviewController::class, 'committeeReviewPage'])->name('committee-review');
});
