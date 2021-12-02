<?php

return [
  'sid' => env('TWILIO_SID', ''),
  'token' => env('TWILIO_AUTH_TOKEN', ''),
  'number' => env('TWILIO_NUMBER', ''),
  'test_recipient_number' => env('TESTING_RECIPIENT_NUMBER', ''),
];