<?php

use App\Http\Controllers\PublishedRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/publishing-page', [PublishedRequestController::class, 'publishingPage']);
    Route::get('/publishing-batches', [PublishedRequestController::class, 'publishingBatches']);
});
