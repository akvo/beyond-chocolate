<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Twilio\Rest\Client;
use App\Models\User;

class TwilioController extends Controller
{
    public function sendOtpCode(Request $request)
    {
        # TODO:: Generate OTP code, then send to user & save to user table;
        $code = substr(number_format(time() * rand(),0,'',''),0,6);
        $user = User::find($request->user);
        $recipients = $user->phone_number;
        $msg = "OTP Code : $code";
        $send = $this->sendMessage($msg, $recipients);

        # update otp_code to users table
        if ($send) {
            $user->otp_code = $code;
            $user->save();
            return $user;
        }
        return $send;
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
