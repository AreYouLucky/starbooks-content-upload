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
        Schema::table('content_approval_requests', function (Blueprint $table): void {
            $table->foreignId('committee_reviewer_id')
                ->nullable()
                ->constrained('content_reviewers')
                ->nullOnDelete()
                ->after('committee_reviewed_date');
            $table->foreignId('quality_assurance_reviewer_id')
                ->nullable()
                ->constrained('content_reviewers')
                ->nullOnDelete()
                ->after('committee_reviewer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('content_approval_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('committee_reviewer_id');
            $table->dropConstrainedForeignId('quality_assurance_reviewer_id');
        });
    }
};
