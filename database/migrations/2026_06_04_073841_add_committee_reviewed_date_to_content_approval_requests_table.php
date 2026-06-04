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
        Schema::table('content_approval_requests', function (Blueprint $table) {
            $table->date('committee_reviewed_date')->nullable()->after('EditDate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('content_approval_requests', function (Blueprint $table) {
            $table->dropColumn('committee_reviewed_date');
        });
    }
};
