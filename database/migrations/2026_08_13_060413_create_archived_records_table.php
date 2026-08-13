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
        if (Schema::hasTable('archived_records')) {
            return;
        }

        Schema::create('archived_records', function (Blueprint $table) {
            $table->id();
            $table->string('HoldingsID')->nullable();
            $table->string('MaterialType')->nullable();
            $table->string('Title')->nullable();
            $table->string('SubTitle')->nullable();
            $table->string('SeriesTitle')->nullable();
            $table->text('BibliographicNote')->nullable();
            $table->string('Contents')->nullable();
            $table->text('Abstracts')->nullable();
            $table->string('JournalTitle')->nullable();
            $table->string('AgencyCode')->nullable();
            $table->string('BroadClass')->nullable();
            $table->string('PhysicalExtension')->nullable();
            $table->string('VolumeNo')->nullable();
            $table->string('IssueNo')->nullable();
            $table->string('IssueDate')->nullable();
            $table->string('Author')->nullable();
            $table->string('AuthorStmt')->nullable();
            $table->string('Type')->nullable();
            $table->string('Subject')->nullable();
            $table->string('Publication')->nullable();
            $table->string('EditDate')->nullable();
            $table->string('date_uploaded')->nullable();
            $table->string('attribution')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->string('url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /** The table may predate this compatibility migration. */
    }
};
