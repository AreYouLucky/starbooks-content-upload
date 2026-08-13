export type UserRoleValue = 'stii_admin' | 'committee' | 'quality' | 'head_committee';

export type UserRoleOption = {
    value: UserRoleValue;
    label: string;
};

export const userRoleOptions: UserRoleOption[] = [
    { value: 'stii_admin', label: 'STII Admin' },
    { value: 'committee', label: 'Initial Reviewer' },
    { value: 'quality', label: 'Quality Assurance' },
    { value: 'head_committee', label: 'Head Committee' }
];

export function formatUserRole(role: string): string {
    return userRoleOptions.find((option) => option.value === role)?.label ?? role;
}
