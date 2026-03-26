<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BulkUploadController;

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::resource('/bulk-upload', BulkUploadController::class);
});