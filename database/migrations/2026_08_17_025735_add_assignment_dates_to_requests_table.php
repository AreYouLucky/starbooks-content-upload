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
            $table->dateTime('initial_reviewed_assigned_date')
                ->nullable()
                ->after('initial_reviewer_id');
            $table->dateTime('quality_assurance_assigned_date')
                ->nullable()
                ->after('quality_assurance_reviewer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dropColumn([
                'initial_reviewed_assigned_date',
                'quality_assurance_assigned_date',
            ]);
        });
    }
};
