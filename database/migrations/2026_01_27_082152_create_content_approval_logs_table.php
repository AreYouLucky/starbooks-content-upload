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
        Schema::create('content_approval_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('approval_request_id');
            $table->foreign('approval_request_id')->references('id')->on('content_approval_requests')->onDelete('cascade');
            $table->unsignedBigInteger('content_reviewer_id');
            $table->foreign('content_reviewer_id')->references('id')->on('content_reviewers')->onDelete('cascade');
            $table->unsignedBigInteger('batch_id');
            $table->foreign('batch_id')->references('id')->on('content_batches')->onDelete('cascade');
            $table->boolean('is_approved')->nullable();
            $table->text('remarks')->nullable();
            $table->integer('approval_status')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_approval_logs');
    }
};
