<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function page(): Response
    {
        return Inertia::render('settings/settings-page');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'status' => 'Password successfully updated!',
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'full_name' => ['required', 'string', 'max:255', Rule::unique('users', 'full_name')->ignore($user->id)],
            'delivery_unit' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'task_description' => ['required', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'Profile successfully updated!',
        ]);
    }
}
