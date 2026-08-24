<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQualityAssuranceRejectedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['stii_admin', 'super_admin', 'admin'], true);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $requestId = $this->route('id');

        return [
            'Title' => [
                'required',
                'string',
                Rule::unique('starbooks.tblrecord', 'Title'),
                Rule::unique('requests', 'Title')->ignore($requestId),
            ],
            'Author' => ['required', 'string'],
            'HoldingsID' => ['required', 'string'],
            'Contents' => ['required', 'string'],
            'MaterialType' => ['required', 'string'],
            'JournalTitle' => ['nullable', 'string'],
            'Subject' => ['nullable', 'string'],
            'SubTitle' => ['nullable', 'string'],
            'VolumeNo' => ['nullable', 'string'],
            'IssueNo' => ['nullable', 'string'],
            'IssueDate' => ['nullable', 'string'],
            'BroadClass' => ['required', 'string'],
            'AgencyCode' => ['required', 'string'],
            'Type' => ['required', 'string'],
            'batch_id' => ['required', 'integer', Rule::exists('batches', 'id')],
            'Abstracts' => ['required', 'string'],
        ];
    }
}
