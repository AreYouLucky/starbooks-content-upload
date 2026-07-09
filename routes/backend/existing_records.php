<?php

use App\Http\Controllers\ExistingRecordsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::get('/existing-records', [ExistingRecordsController::class, 'index'])->name('existing-records.index');
    Route::post('/existing-records/{id}/unpublish', [ExistingRecordsController::class, 'unpublish'])->name('existing-records.unpublish');
    Route::post('/archived-records/{id}/republish', [ExistingRecordsController::class, 'republish'])->name('existing-records.republish');
    Route::get('/existing-records/{status}/{id}/edit', [ExistingRecordsController::class, 'edit'])
        ->whereIn('status', ['published', 'unpublished'])
        ->name('existing-records.edit');
    Route::post('/existing-records/{status}/{id}', [ExistingRecordsController::class, 'update'])
        ->whereIn('status', ['published', 'unpublished'])
        ->name('existing-records.update');
});
