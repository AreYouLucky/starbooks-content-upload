<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    /**
     * @var list<string>
     */
    private const ROLES = ['stii_admin', 'committee', 'quality', 'head_committee'];

    public function page(): Response
    {
        return Inertia::render('users/users-page');
    }

    public function index(): JsonResponse
    {
        $users = User::query()
            ->select('id', 'username', 'full_name', 'delivery_unit', 'role', 'designation', 'task_description')
            ->whereNot('role', 'super_admin')
            ->orderBy('full_name')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique(User::class, 'username')],
            'full_name' => ['required', 'string', 'max:255', Rule::unique(User::class, 'full_name')],
            'delivery_unit' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'designation' => ['required', 'string', 'max:255'],
            'task_description' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed', Password::default()],
        ]);

        User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'status' => 'Account successfully created!',
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique(User::class, 'username')->ignore($user->id)],
            'full_name' => ['required', 'string', 'max:255', Rule::unique(User::class, 'full_name')->ignore($user->id)],
            'delivery_unit' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'designation' => ['required', 'string', 'max:255'],
            'task_description' => ['required', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'Account successfully updated!',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'status' => 'Account successfully deleted!',
        ]);
    }

    public function changePassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed', Password::default()],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'status' => 'Password successfully updated!',
        ]);
    }
}
