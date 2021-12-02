<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DownloadLog;
use App\Http\Controllers\EmailController;

class DownloadLogController extends Controller
{
    //
    public function getAllDownloadLog(DownloadLog $downloadLog)
    {
        $logs = $downloadLog->with('requested')->get();
        if (count($logs)) {
            $logs = $logs->map(function ($log) {
                $log['request_by'] = collect($log->requested)->only('id', 'name', 'email');
                return collect($log)->only('id', 'filepath', 'request_by', 'status');
            });
        }
        return $logs;
    }

    public function updateDownloadLogStatus(Request $request, DownloadLog $downloadLog)
    {
        $log = $downloadLog->find($request->id);
        if (!$log) {
            return \response('Download log not found', 204);
        }
        $user = $request->user();
        $log->status = $request->status;
        $log->approve_by = $user->id;
        $log->updated_at = now();
        $log->save();

        # TODO:: send notification email to user
        $email = new EmailController();

        return $email->informUserDataDownloadEmail($log);
    }
}
