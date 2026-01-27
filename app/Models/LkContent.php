<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LkContent extends Model
{
    protected $table = 'lk_contents';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'code', 'desc', 'vol','issue'
    ];

    public function records()
    {
        return $this->hasMany(Record::class, 'Contents', 'code');
    }
}
