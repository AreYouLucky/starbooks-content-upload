<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApprovalRequestAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'head_committee' || $this->user()?->role === 'super_admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'committee_reviewer_id' => [
                'nullable',
                'integer',
                Rule::exists(User::class, 'id')->whereIn('role', ['committee', 'head_committee']),
            ],
            'quality_assurance_reviewer_id' => [
                'nullable',
                'integer',
                Rule::exists(User::class, 'id')->where('role', 'quality'),
            ],
        ];
    }
}
