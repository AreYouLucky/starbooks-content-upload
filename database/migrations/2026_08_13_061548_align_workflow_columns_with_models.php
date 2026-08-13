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
        $batchColumns = [
            'start_date' => fn (Blueprint $table) => $table->date('start_date')->nullable()->after('batch_description'),
            'target_shortlist_date' => fn (Blueprint $table) => $table->date('target_shortlist_date')->nullable()->after('start_date'),
            'shortlisted_date' => fn (Blueprint $table) => $table->dateTime('shortlisted_date')->nullable()->after('target_shortlist_date'),
            'initial_reviewed_date' => fn (Blueprint $table) => $table->dateTime('initial_reviewed_date')->nullable()->after('target_initial_review_date'),
            'target_quality_approval_date' => fn (Blueprint $table) => $table->date('target_quality_approval_date')->nullable()->after('initial_reviewed_date'),
            'quality_approval_date' => fn (Blueprint $table) => $table->dateTime('quality_approval_date')->nullable()->after('target_quality_approval_date'),
            'published_date' => fn (Blueprint $table) => $table->dateTime('published_date')->nullable()->after('target_published_date'),
            'status' => fn (Blueprint $table) => $table->string('status')->default('for shortlisting')->after('published_date'),
            'is_active' => fn (Blueprint $table) => $table->boolean('is_active')->default(true)->after('status'),
            'is_dost' => fn (Blueprint $table) => $table->boolean('is_dost')->default(false)->after('is_active'),
        ];

        foreach ($batchColumns as $column => $definition) {
            if (! Schema::hasColumn('batches', $column)) {
                Schema::table('batches', $definition);
            }
        }

        if (! Schema::hasColumn('requests', 'quality_assurance_date')) {
            Schema::table('requests', function (Blueprint $table): void {
                $table->date('quality_assurance_date')->nullable()->after('initial_reviewed_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /** This compatibility migration cannot distinguish columns it added from pre-existing columns. */
    }
};
