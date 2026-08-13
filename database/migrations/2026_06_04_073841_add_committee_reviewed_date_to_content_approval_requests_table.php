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
        Schema::table('requests', function (Blueprint $table): void {
            $table->date('initial_reviewed_date')->nullable()->after('EditDate');
            $table->date('quality_assurance_date')->nullable()->after('initial_reviewed_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dropColumn(['initial_reviewed_date', 'quality_assurance_date']);
        });
    }
};
