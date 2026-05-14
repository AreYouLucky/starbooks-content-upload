<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class ViewerController extends Controller
{
    public function getMediafiles(string $HoldingsID): JsonResponse
    {
        $data = [];
        $path = public_path('assets/fulltext/'.$HoldingsID);

        if (file_exists($path)) {
            $files = array_values(array_diff(scandir($path) ?: [], ['.', '..']));
            natsort($files);

            foreach ($files as $value) {
                $data[] = 'assets/fulltext/'.$HoldingsID.'/'.$value;
            }
        }

        return response()->json($data);
    }
}
