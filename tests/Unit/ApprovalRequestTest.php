<?php

use App\Models\ApprovalRequest;

test('committee reviewed date matches the approval request migration', function () {
    $approvalRequest = new ApprovalRequest;

    expect($approvalRequest->getFillable())->toContain('committee_reviewed_date')
        ->and($approvalRequest->getCasts())
        ->toHaveKey('committee_reviewed_date', 'date');
});
