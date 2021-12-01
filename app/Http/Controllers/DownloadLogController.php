<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DownloadLog;

class DownloadLogController extends Controller
{
    //
    public function getAllDownloadLog(DownloadLog $downloadLog)
    {
        $logs = $downloadLog->with('requested')->get();
        if (count($logs)) {
            $logs = $logs->map(function ($log) {
                $log['request_by'] = collect($log->requested)->only('id', 'name', 'email');
                return collect($log)->only('id', 'filepath', 'request_by');
            });
        }
        return $logs;
    }
}
