export type UserRoleValue = 'stii_admin' | 'committee' | 'quality';

export type UserRoleOption = {
    value: UserRoleValue;
    label: string;
};

export const userRoleOptions: UserRoleOption[] = [
    { value: 'stii_admin', label: 'STII Admin' },
    { value: 'committee', label: 'Committee Reviewer' },
    { value: 'quality', label: 'Quality Assurance' },
];

export function formatUserRole(role: string): string {
    return userRoleOptions.find((option) => option.value === role)?.label ?? role;
}
