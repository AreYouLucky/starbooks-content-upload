<?php

use App\Http\Controllers\QARejectedController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'qa_rejected'])->group(function () {
    Route::get('/quality-assurance-rejected', [QARejectedController::class, 'rejectedRequestsPage']);
    Route::get('/quality-assurance-rejected/{id}/edit', [QARejectedController::class, 'editRejectedRequest']);
    Route::post('/quality-assurance-rejected/{id}', [QARejectedController::class, 'updateRejectedRequest']);
    Route::post('/quality-assurance-rejected/{id}/forward', [QARejectedController::class, 'forwardRejectedRequestToQualityAssurance']);
});
