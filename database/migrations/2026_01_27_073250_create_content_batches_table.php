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
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name')->unique();
            $table->string('quarter');
            $table->string('year');
            $table->string('content_source');
            $table->text('batch_description');
            $table->date('start_date')->nullable();
            $table->date('target_shortlist_date')->nullable();
            $table->dateTime('shortlisted_date')->nullable();
            $table->date('target_initial_review_date');
            $table->dateTime('initial_reviewed_date')->nullable();
            $table->date('target_quality_approval_date')->nullable();
            $table->dateTime('quality_approval_date')->nullable();
            $table->date('target_published_date');
            $table->dateTime('published_date')->nullable();
            $table->string('status')->default('for shortlisting');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_dost')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
