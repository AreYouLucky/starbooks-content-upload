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
        Schema::create('log_details', function (Blueprint $table) {
            $table->id();
            $table->integer('approval_status');
            $table->foreignId('request_id')->constrained('requests')->cascadeOnDelete();
            $table->foreignId('log_id')->constrained('logs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
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
        Schema::dropIfExists('log_details');
    }
};
