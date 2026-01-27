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
        Schema::create('content_log_details', function (Blueprint $table) {
            $table->id();
            $table->integer('approval_status');
            $table->unsignedBigInteger('approval_request_id');
            $table->foreign('approval_request_id')->references('id')->on('content_approval_requests')->onDelete('cascade');
            $table->unsignedBigInteger('content_log_id');
            $table->foreign('content_log_id')->references('id')->on('content_approval_logs')->onDelete('cascade');
            $table->unsignedBigInteger('content_reviewer_id');
            $table->foreign('content_reviewer_id')->references('id')->on('content_reviewers')->onDelete('cascade');
            $table->boolean('is_passed')->nullable();
            $table->string('description')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_log_details');
    }
};
