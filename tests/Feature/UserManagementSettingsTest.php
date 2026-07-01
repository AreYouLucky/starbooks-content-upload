<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

function createReviewer(array $attributes = []): User
{
    return User::query()->create(array_merge([
        'username' => 'reviewer_'.fake()->unique()->bothify('????####'),
        'full_name' => 'Reviewer '.fake()->unique()->bothify('????####'),
        'delivery_unit' => 'IRAD',
        'role' => 'admin',
        'designation' => 'Content Reviewer',
        'task_description' => 'Reviews uploaded STARBOOKS content.',
        'password' => Hash::make('password123'),
    ], $attributes));
}

test('authenticated admins can open user management and settings pages', function () {
    $user = createReviewer();

    $this->actingAs($user)
        ->get('/manage-users')
        ->assertOk();

    $this->actingAs($user)
        ->get('/settings')
        ->assertOk();
});

test('user management creates and updates accounts with username instead of email', function () {
    $admin = createReviewer();

    $this->actingAs($admin)
        ->postJson('/users', [
            'username' => 'encoded_user',
            'full_name' => 'Encoded User',
            'delivery_unit' => 'FAD',
            'role' => 'committee',
            'designation' => 'Encoder',
            'task_description' => 'Uploads content records.',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Account successfully created!');

    $user = User::query()->where('username', 'encoded_user')->firstOrFail();

    expect($user->full_name)->toBe('Encoded User');

    $this->actingAs($admin)
        ->postJson("/update-user/{$user->id}", [
            'username' => 'updated_user',
            'full_name' => 'Updated User',
            'delivery_unit' => 'STII',
            'role' => 'quality',
            'designation' => 'Supervisor',
            'task_description' => 'Supervises upload workflow.',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Account successfully updated!');

    expect($user->refresh()->username)->toBe('updated_user')
        ->and($user->full_name)->toBe('Updated User')
        ->and($user->delivery_unit)->toBe('STII')
        ->and($user->role)->toBe('quality');
});

test('settings update the authenticated profile by username fields', function () {
    $user = createReviewer([
        'username' => 'settings_user',
        'full_name' => 'Settings User',
    ]);

    $this->actingAs($user)
        ->postJson('/update-profile', [
            'username' => 'settings_updated',
            'full_name' => 'Settings Updated',
            'delivery_unit' => 'OD',
            'designation' => 'System User',
            'task_description' => 'Keeps profile details current.',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Profile successfully updated!');

    expect($user->refresh()->username)->toBe('settings_updated')
        ->and($user->full_name)->toBe('Settings Updated')
        ->and($user->delivery_unit)->toBe('OD');
});
