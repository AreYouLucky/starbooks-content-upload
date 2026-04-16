<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Batch;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class BatchesController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function viewBatches()
    {
        return Inertia::render('batches/batches-page');
    }

    public function index(Request $request)
    {
        $query = Batch::where('is_active', 1);
        if ($request->filled('search')) {
            $query->where('batch_name', 'LIKE', '%' . $request->search . '%')
                ->orWhere('batch_description', 'LIKE', '%' . $request->search . '%');
        }
        return  $query->orderBy('created_at', 'desc')->paginate(5);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('batches/batch-form');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'content_source' => 'required|string|max:100',
            'year' => 'required|string|max:50',
            'quarter' => 'required|string|max:50',
            'batch_description' => 'required|string|max:255',
            'start_date' => 'required|string|max:100',
            'is_dost' => 'required|boolean'
        ]);
        $existing_count = Batch::where('year', $request->year)
            ->where('quarter', $request->quarter)
            ->count();

        $batch_number = str_pad($existing_count + 1, 4, '0', STR_PAD_LEFT);
        $batch_name =   $request->year . Str::upper($request->quarter) . '-B' . $batch_number;


        $date = Carbon::parse($request->start_date)->startOfDay();
        $shortlisting_date = $date->copy()->addWeekdays(7);
        if (!$request->is_dost) {
            $ir_date = $date->copy()->addWeekdays(28);
            $qa_date = $date->copy()->addWeekdays(42);
            $uploading_date = $date->copy()->addWeekdays(47);
        } else {
            $ir_date = $date->copy()->addWeekdays(14);
            $qa_date = $date->copy()->addWeekdays(14);
            $uploading_date = $date->copy()->addWeekdays(19);
        }

        Batch::create([
            'batch_name' => $batch_name,
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'start_date' => $date,
            'target_shortlist_date' => $shortlisting_date,
            'target_initial_review_date' => $ir_date,
            'target_quality_approval_date' => $qa_date,
            'target_published_date' => $uploading_date,
            'status' => 'for shortlisting',
            'is_dost' => $request->is_dost,
            'year' => $request->year,
            'quarter' => $request->quarter
        ]);

        return response()->json([
            'message' => "Batches Successfully Created"
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }


    public function update(Request $request, string $id)
    {
        $request->validate([
            'content_source' => 'required|string|max:100',
            'year' => 'required|string|max:50',
            'quarter' => 'required|string|max:50',
            'batch_description' => 'required|string|max:255',
            'start_date' => 'required|string|max:100',
            'is_dost' => 'required|boolean'
        ]);

        $batch = Batch::find($id);

        if (
            $batch->year != $request->year ||
            $batch->quarter != $request->quarter
        ) {
            $existing_count = Batch::where('year', $request->year)
                ->where('quarter', $request->quarter)
                ->count();

            $batch_number = str_pad($existing_count + 1, 4, '0', STR_PAD_LEFT);
            $batch_name = $request->year . Str::upper($request->quarter) . '-B' . $batch_number;
            $batch->batch_name = $batch_name;
            $batch->save();
        }


        $date = Carbon::parse($request->start_date)->startOfDay();
        $shortlisting_date = $date->copy()->addWeekdays(7);
        if (!$request->is_dost) {
            $ir_date = $date->copy()->addWeekdays(28);
            $qa_date = $date->copy()->addWeekdays(42);
            $uploading_date = $date->copy()->addWeekdays(47);
        } else {
            $ir_date = $date->copy()->addWeekdays(14);
            $qa_date = $date->copy()->addWeekdays(14);
            $uploading_date = $date->copy()->addWeekdays(19);
        }
        $batch->update([
            'content_source' => $request->content_source,
            'batch_description' => $request->batch_description,
            'start_date' => $date,
            'target_shortlist_date' => $shortlisting_date,
            'target_initial_review_date' => $ir_date,
            'target_quality_approval_date' => $qa_date,
            'target_published_date' => $uploading_date,
            'status' => 'for shortlisting',
            'is_dost' => $request->is_dost,
            'year' => $request->year,
            'quarter' => $request->quarter
        ]);

        return response()->json([
            'message' => "Batches Successfully Updated"
        ]);
    }
}
