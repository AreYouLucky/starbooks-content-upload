<?php

use App\Http\Controllers\ViewerController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/viewer/{HoldingsID}', [ViewerController::class, 'getMediafiles']);
});

require __DIR__.'/authentication/authentication.php';
require __DIR__.'/backend/dashboard.php';
require __DIR__.'/backend/batches.php';
require __DIR__.'/backend/shortlist.php';
require __DIR__.'/backend/single_upload.php';
require __DIR__.'/backend/bulk_upload.php';
require __DIR__.'/backend/committee.php';
