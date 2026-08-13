<?php

use App\Models\LkContent;
use App\Models\Record;

test('starbooks models use the external database connection', function () {
    expect((new LkContent)->getConnectionName())->toBe('starbooks')
        ->and((new LkContent)->getTable())->toBe('lk_contents')
        ->and((new Record)->getConnectionName())->toBe('starbooks')
        ->and((new Record)->getTable())->toBe('tblrecord');
});
