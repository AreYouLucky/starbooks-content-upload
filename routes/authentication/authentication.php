<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;

Route::middleware('guest')->group(function () {
    Route::get('/', function () {
        return Inertia::render('auth/auth-page');
    })->name('login');
    Route::post('/request-login', [AuthController::class, 'login']);
});
Route::middleware('auth')->group(function () {
    Route::get('/logout', [AuthController::class, 'logout'])->name('logout');
});
