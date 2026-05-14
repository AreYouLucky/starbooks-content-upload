<?php

use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('guests are redirected away from the viewer endpoint', function () {
    $this->get('/viewer/TEST-HOLDING')
        ->assertRedirect(route('login'));
});

test('authenticated users can retrieve naturally ordered media files for a holding', function () {
    $holdingId = 'TEST_VIEWER_'.Str::upper(Str::random(6));
    $directory = public_path("assets/fulltext/{$holdingId}");

    File::ensureDirectoryExists($directory);
    File::put("{$directory}/page-10.pdf", 'ten');
    File::put("{$directory}/page-2.pdf", 'two');
    File::put("{$directory}/page-1.pdf", 'one');

    $user = User::query()->create([
        'username' => 'viewer_'.Str::lower(Str::random(8)),
        'full_name' => 'Viewer Test '.Str::random(6),
        'delivery_unit' => 'QA',
        'role' => 'Reviewer',
        'designation' => 'Tester',
        'task_description' => 'Viewer route test',
        'password' => Hash::make('password'),
    ]);

    try {
        $this->actingAs($user)
            ->get("/viewer/{$holdingId}")
            ->assertOk()
            ->assertExactJson([
                "assets/fulltext/{$holdingId}/page-1.pdf",
                "assets/fulltext/{$holdingId}/page-2.pdf",
                "assets/fulltext/{$holdingId}/page-10.pdf",
            ]);
    } finally {
        File::deleteDirectory($directory);
    }
});
