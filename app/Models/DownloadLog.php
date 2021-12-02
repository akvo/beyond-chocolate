<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DownloadLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'web_form_id',
        'form_id',
        'uuid',
        'filepath',
        'status',
        'request_by',
        'approve_by',
    ];

    public function webform()
    {
        return $this->belongsTo('\App\Models\WebForm');
    }

    public function form()
    {
        return $this->belongsTo('\Akvo\Models\Form');
    }

    public function requested()
    {
        return $this->belongsTo('\App\Models\User', 'request_by', 'id');
    }

    public function approved()
    {
        return $this->belongsTo('\App\Models\User', 'approve_by', 'id');
    }
}
