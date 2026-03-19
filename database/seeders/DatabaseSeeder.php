<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'username' => 'admin',
            'password' => Hash::make('aaaaaaaa'),
            'full_name' => 'Admin',
            'role' => 'admin',
            'delivery_unit' => 'IRAD',
            'designation' => 'System Admin',
            'task_description' => 'Manages the system'
        ]);
    }
}
