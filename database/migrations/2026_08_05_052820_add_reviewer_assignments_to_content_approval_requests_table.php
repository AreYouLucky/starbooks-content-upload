<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->foreignId('initial_reviewer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('quality_assurance_date');
            $table->foreignId('quality_assurance_reviewer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('initial_reviewer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('initial_reviewer_id');
            $table->dropConstrainedForeignId('quality_assurance_reviewer_id');
        });
    }
};
