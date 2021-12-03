<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\FlowDataSyncController;

class FlowSyncCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'flow:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Akvo Flow data using Sync API';

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
        $flow = new FlowDataSyncController();
        $start = microtime(true);
        # TODO :: sync flow tables
        $this->info("Sync...");
        Log::info('Start Flow Sync - '.now());
        $sync = $flow->syncData();
        $time_elapsed_secs = microtime(true) - $start;
        $this->info("Time : ".date("H:i:s",$time_elapsed_secs));
        Log::info('End Flow Sync - '.now());
    }
}
