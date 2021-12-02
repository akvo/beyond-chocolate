<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Twilio\Rest\Client;

class TwilioController extends Controller
{
    public function sendOtpCode()
    {
        $recipients = config('twilio.test_recipient_number');
        $msg = "OTP Code : 623451";
        return $this->sendMessage($msg, $recipients);
    }

    /**
     * Sends sms to user using Twilio's programmable sms client
     * @param String $message Body of sms
     * @param Number $recipients Number of recipient
     */
    private function sendMessage($message, $recipients)
    {
        $config = config('twilio');
        $account_sid = $config['sid'];
        $auth_token = $config['token'];
        $twilio_number = $config['number'];
        $client = new Client($account_sid, $auth_token);
        return $client->messages->create($recipients, ['from' => $twilio_number, 'body' => $message]);
    }
}
