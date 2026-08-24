<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dateTime('published_at')->nullable()->after('quality_assurance_assigned_date');
        });

        DB::table('requests')
            ->select('id', 'batch_id')
            ->where('approval_status', 6)
            ->whereNull('published_at')
            ->whereNotNull('batch_id')
            ->orderBy('id')
            ->chunkById(100, function ($requests): void {
                $publishedDates = DB::table('batches')
                    ->whereIn('id', $requests->pluck('batch_id')->unique())
                    ->whereNotNull('published_date')
                    ->pluck('published_date', 'id');

                foreach ($requests as $request) {
                    $publishedAt = $publishedDates->get($request->batch_id);

                    if ($publishedAt !== null) {
                        DB::table('requests')
                            ->where('id', $request->id)
                            ->update(['published_at' => $publishedAt]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dropColumn('published_at');
        });
    }
};
