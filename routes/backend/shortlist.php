<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShortlistController;


Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::get('/view-shortlisted', [ShortlistController::class, 'viewShortlistPage'])->name('shortlist');
    Route::resource('/shortlist', ShortlistController::class);
    Route::post('/toggle-batch-shortlist/{id}', [ShortlistController::class, 'toggleBatchShortlist']);
});
