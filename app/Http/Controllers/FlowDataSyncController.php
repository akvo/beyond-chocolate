<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Akvo\Api\Auth;
use Akvo\Api\FlowApi;
use Akvo\Models\Sync;
use App\Seeds\DataPointSeeder;
use App\Seeds\FormSeeder;
use App\Models\WebForm;
use Illuminate\Support\Facades\Log;

class FlowDataSyncController extends Controller
{
    /**
     * init true -> run this sync for all data
     *      false -> run this sync based on given uuid
     */
    public function syncData($init = true, $uuid = null)
    {
        $config = config('bc');
        $surveys = collect($config['forms']);

        // collections
        // $dataPointDeleted = collect();
        // $dataPointChanged = collect();
        // $formChanged = collect();
        // $surveyChanged = collect();
        // $formInstanceDeleted = collect();
        // $formInstanceChanged = collect();
        // $formDeleted = collect();
        // $surveyDeleted = collect();

        $sync_url = Sync::all()->last()['url'];
        $auth = new Auth();
        $token = $auth->getToken();
        Log::info('TOKEN', [$token]);
        if (!$token) {
            return "Invalid Access";
        }
        $api = new FlowApi($auth);
        $dataPointSeeder = new DataPointSeeder($api, null);

        $repeat = true;
        do {
            Log::info('SYNC URL', [$sync_url]);
            $results = $api->fetch($sync_url);
            if ($results === 204) {
                # TODO :: save sync_url
                $this->updateSyncUrl($sync_url);
                $repeat = false;
                continue;
            }
            $surveyChanged = collect($results['changes']['surveyChanged']);
            // SURVEY
            if ($init && count($surveyChanged) > 0) {
                $survey_changes = $surveyChanged->whereIn('id', $surveys->pluck('surveyGroupId'))->values();
                foreach ($survey_changes as $key => $survey) {
                    $input = \Akvo\Models\Survey::updateOrCreate(
                        ['id' => (int) $survey['id']],
                        [
                            'id' => (int) $survey['id'],
                            'name' => $survey['name'],
                            'path' => '',
                            'registration_id' => (int) $survey['registrationFormId']
                        ]
                    );
                }
            }

            $formChanged = collect($results['changes']['formChanged']);
            // FORM
            if ($init && count($formChanged) > 0) {
                $formIds = $surveys->pluck('surveyId');
                $forms = $formChanged->whereIn('id', $formIds)->values();
                foreach ($forms as $key => $form) {
                    $survey = $surveys->where('surveyId', $form['id'])->first();
                    $input = \Akvo\Models\Form::updateOrCreate(
                        ['id' => (int) $form['id']],
                        [
                            'id' => (int) $form['id'],
                            'survey_id' => (int) $survey['surveyGroupId'],
                            'name' => $form['name']
                        ]
                    );
                }
                $formSeeder = new FormSeeder($api);
                $formSeeder->seed(false, $forms);
            }

            $formInstanceChanged = collect($results['changes']['formInstanceChanged']);
            $dataPointChanged = collect($results['changes']['dataPointChanged']);
            // DATAPOINT & FORM_INSTANCE
            if (count($dataPointChanged) > 0 || count($formInstanceChanged) > 0) {
                # TODO :: collect all webform table value if submitted
                $webforms = WebForm::where('submitted', true)->pluck('uuid');
                if (!$init && !is_null($uuid) && !collect($webforms)->contains($uuid)) {
                    $webforms = collect($webforms)->push($uuid);
                }
                $datapoints = $dataPointChanged->whereIn('identifier', $webforms)->values();;
                $form_instances = $formInstanceChanged->whereIn('identifier', $webforms)->values();
                foreach ($form_instances as $key => $fi) {
                    $survey = $surveys->where('surveyId', $fi['formId'])->first();
                    $datapoint_updates = $dataPointSeeder->seedDataPoints(null, false, $datapoints, $survey['surveyGroupId']);
                }
                $form_instance_updates = $dataPointSeeder->seedFormInstances(null, null, false, $form_instances);
            }

            $formInstanceDeleted = collect($results['changes']['formInstanceDeleted']);
            // FORM INSTANCE DELETED
            if ($init & count($formInstanceDeleted) > 0) {
                $fis = $formInstanceDeleted->values();
                // also delete webforms table
                $fiData = \Akvo\Models\FormInstance::whereIn('fid', $fis)->get();
                $webformsDeleted = WebForm::where('submitted', true)->whereIn('uuid', $fiData->pluck('identifier'))->delete();
                $fiDeleted = \Akvo\Models\FormInstance::whereIn('fid', $fis)->delete();
            }

            $dataPointDeleted = collect($results['changes']['dataPointDeleted']);
            // DATAPOINT DELETED
            if ($init & count($dataPointDeleted) > 0) {
                $dpIds = $dataPointDeleted->values();
                $dpDeleted = \Akvo\Models\DataPoint::whereIn('id', $dpIds)->delete();
            }

            $formDeleted = collect($results['changes']['formDeleted']);
            // FORM DELETED
            if ($init & count($formDeleted) > 0) {
                $fIds = $formDeleted->values();
                $fDeleted = \Akvo\Models\Form::whereIn('id', $fIds)->delete();
            }

            $surveyDeleted = collect($results['changes']['surveyDeleted']);
            // SURVEY DELETED
            if ($init & count($surveyDeleted) > 0) {
                $sIds = $surveyDeleted->values();
                $sDeleted = \Akvo\Models\Survey::whereIn('id', $sIds)->delete();
            }

            # TODO :: save sync_url
            $this->updateSyncUrl($sync_url);

            $sync_url = $results['nextSyncUrl'];
            Log::info('NEXT SYNC URL', [$sync_url]);
        } while($repeat);

        return ($init) ? "Done" : true;
    }

    private function updateSyncUrl($sync_url)
    {
        # TODO :: save sync_url
        $config = config('bc');
        $sync = null;
        $checkSyncUrl = Sync::where('url', $sync_url)->first();
        if(is_null($checkSyncUrl)) {
            $sync = Sync::create(['survey_id' => $config['flow_projects_survey_group_id'], 'url' => $sync_url]);
        }
        return $sync;
    }
}
