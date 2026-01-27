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
        Schema::create('content_approval_requests', function (Blueprint $table) {
            $table->id();
            $table->integer('approval_status')->default(0);
            $table->string('HoldingsID')->nullable();
            $table->string('MaterialType')->nullable();
            $table->string('Title')->nullable();
            $table->string('FileName')->nullable();
            $table->string('SubTitle')->nullable();
            $table->string('SeriesTitle')->nullable();
            $table->text('BibliographicNote')->nullable();
            $table->text('Contents')->nullable();
            $table->text('Abstracts')->nullable();
            $table->string('JournalTitle')->nullable();
            $table->string('AgencyCode')->nullable();
            $table->string('BroadClass')->nullable();
            $table->string('VolumeNo')->nullable();
            $table->string('IssueNo')->nullable();
            $table->date('IssueDate')->nullable();
            $table->string('Author')->nullable();
            $table->string('Type')->nullable();
            $table->string('Subject')->nullable();
            $table->dateTime('EditDate')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->foreign('uploaded_by')->references('id')->on('content_reviewers')->onDelete('cascade');
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->foreign('batch_id')->references('id')->on('content_batches')->onDelete('cascade');
            $table->boolean('is_active')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_approval_requests');
    }
};
