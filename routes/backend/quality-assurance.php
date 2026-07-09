<?php

use App\Http\Controllers\QualityAssuranceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'quality'])->group(function () {
    Route::get('/quality-assurance-page', [QualityAssuranceController::class, 'qualityAssurancePage']);
    Route::get('/quality-assurance-batches', [QualityAssuranceController::class, 'qualityAssuranceBatches']);
    Route::get('/view-quality-assurance-batch/{name}', [QualityAssuranceController::class, 'viewApprovalRequests']);
    Route::get('/quality-assurance-request/{holdingsID}', [QualityAssuranceController::class, 'reviewRequest']);
    Route::post('/submit-quality-assurance-review', [QualityAssuranceController::class, 'submitReview']);
    Route::get('/generate-quality-assurance-report', [QualityAssuranceController::class, 'generateQualityAssuranceReport']);
});

Route::middleware(['auth', 'stii_admin'])->group(function () {
    Route::post('/forward-to-publishing', [QualityAssuranceController::class, 'forwardToPublishing']);
});
