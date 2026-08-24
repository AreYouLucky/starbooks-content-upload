<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ViewWorkflowReportRequest extends FormRequest
{
    private const ALLOWED_ROLES = [
        'shortlisted' => ['stii_admin', 'admin', 'super_admin'],
        'initial-review' => ['committee', 'admin', 'super_admin'],
        'quality-assurance' => ['quality', 'quality_admin', 'admin', 'super_admin'],
        'publishing' => ['stii_admin', 'admin', 'super_admin'],
    ];

    public function authorize(): bool
    {
        $allowedRoles = self::ALLOWED_ROLES[$this->route('section')] ?? [];

        return in_array($this->user()?->role, $allowedRoles, true);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'quarter' => ['required', 'string', 'max:50'],
            'year' => ['required', 'string', 'max:50'],
            'reviewer_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
