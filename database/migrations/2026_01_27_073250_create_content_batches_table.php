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
        Schema::create('content_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name')->unique();
            $table->string('content_source');
            $table->text('batch_description');
            $table->string('target_published_date');
            $table->string('target_initial_review_date');
            $table->string('target_committee_review_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_batches');
    }
};
