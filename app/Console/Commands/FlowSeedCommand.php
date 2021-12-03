<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\FlowDataSeedController;

class FlowSeedCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'flow:seed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Inital Seed of Akvo Flow data using Sync API';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $flow = new FlowDataSeedController();
        $start = microtime(true);

        # TODO :: Check if akvo:migrate already run (table exist)
        $exist = Schema::hasTable('form_instances');
        if (!$exist) {
            # TODO :: call akvo:migrate
            \Artisan::call('akvo:migrate');
        }

        # TODO :: seed flow tables
        $this->info("Seed...");
        Log::info('Start Flow Seed - '.now());
        $seed = $flow->seedFlowData();
        $time_elapsed_secs = microtime(true) - $start;
        $this->info("Time : ".date("H:i:s",$time_elapsed_secs));
        Log::info('End Flow Seed - '.now());
    }
}
