<?php
use App\Http\Controllers\BatchesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth','stii_admin'])->group(function () {
    Route::resource('batches', BatchesController::class);
    Route::get('/view-batches', [BatchesController::class, 'viewBatches'])->name('view-batches');
});