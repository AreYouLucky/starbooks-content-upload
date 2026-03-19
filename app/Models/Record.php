<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Record extends Model
{
    protected $table = 'tblrecord';
    protected $fillable = [
        'HoldingsID',
        'MaterialType',
        'Title',
        'SubTitle',
        'SeriesTitle',
        'BibliographicNote',
        'Contents',
        'Abstracts',
        'JournalTitle',
        'AgencyCode',
        'PhysicalExtension',
        'VolumeNo',
        'IssueNo',
        'IssueDate',
        'Author',
        'AuthorStmt',
        'Type',
        'Subject',
        'Publication',
        'EditDate',
        'date_uploaded',
        'attribution',
        'uploaded_by',
        'url'
    ];
    public $timestamps = false;


}
