<?php

use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ViewerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('/viewer/{HoldingsID}', [ViewerController::class, 'getMediafiles']);
    Route::get('/already-reviewed', function () {
        return Inertia::render('already-reviewed');
    });

    Route::get('/settings', [SettingsController::class, 'page'])->name('settings');
    Route::post('/update-profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::post('/update-password', [SettingsController::class, 'updatePassword'])->name('settings.password.update');

    Route::middleware('stii_admin')->group(function () {
        Route::get('/manage-users', [UsersController::class, 'page'])->name('users.page');
        Route::get('/users', [UsersController::class, 'index'])->name('users.index');
        Route::post('/users', [UsersController::class, 'store'])->name('users.store');
        Route::post('/update-user/{user}', [UsersController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
        Route::post('/change-user-password/{user}', [UsersController::class, 'changePassword'])->name('users.password.update');
    });
});

require __DIR__.'/authentication/authentication.php';
require __DIR__.'/backend/dashboard.php';
require __DIR__.'/backend/batches.php';
require __DIR__.'/backend/shortlist.php';
require __DIR__.'/backend/single_upload.php';
require __DIR__.'/backend/bulk_upload.php';
require __DIR__.'/backend/initial_review.php';
require __DIR__.'/backend/head_committee.php';
require __DIR__.'/backend/quality-assurance.php';
require __DIR__.'/backend/publishing.php';
require __DIR__.'/backend/existing_records.php';
require __DIR__.'/backend/qa_rejected.php';
require __DIR__.'/backend/reports.php';
