<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SingleUploadController;

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::resource('/single-upload', SingleUploadController::class);
    Route::post('/update-single-upload/{id}', [SingleUploadController::class, 'update']);
});