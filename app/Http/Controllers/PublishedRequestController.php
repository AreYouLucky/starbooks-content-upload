<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublishedRequestController extends Controller
{
    public function publishingPage(): Response
    {
        return Inertia::render('publishing/publishing-page');
    }

    public function publishingBatches(Request $request): JsonResponse
    {
        $query = Batch::query()
            ->select([
                'id',
                'batch_name',
                'content_source',
                'batch_description',
                'target_published_date',
                'quality_approval_date',
                'published_date',
                'status',
            ])
            ->where('is_active', 1)
            ->where('status', 'for publishing')
            ->withCount([
                'approvalRequests as records_count',
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('batch_name', 'like', '%'.$search.'%')
                    ->orWhere('batch_description', 'like', '%'.$search.'%')
                    ->orWhere('content_source', 'like', '%'.$search.'%');
            });
        }

        $readyForPublishingCount = (clone $query)->count();
        $publishedCount = Batch::query()
            ->where('is_active', 1)
            ->where('status', 'published')
            ->count();

        $analytics = [
            'for_publishing' => $readyForPublishingCount,
            'published' => $publishedCount,
            'total_batches' => $readyForPublishingCount + $publishedCount,
        ];

        $paginatedBatches = $query->latest()->paginate(5);

        return response()->json([
            ...$paginatedBatches->toArray(),
            'analytics' => $analytics,
        ]);
    }
}
