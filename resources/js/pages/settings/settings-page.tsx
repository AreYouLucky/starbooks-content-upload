import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios, { AxiosError } from 'axios';
import { KeyRound, Save, Settings, UserRound } from 'lucide-react';

import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useHandleChange } from '@/hooks/use-handle-change';
import { useInitials } from '@/hooks/use-initials';
import { formatUserRole } from '@/lib/user-roles';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings' },
];

type ValidationErrorResponse = {
    message?: string;
    errors?: Record<string, string>;
};

function SettingsPage() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const getInitials = useInitials();
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [successDialog, setSuccessDialog] = useState(false);
    const [message, setMessage] = useState('');

    const { item, errors, handleChange, setItem, setErrors } = useHandleChange({
        username: user.username ?? '',
        full_name: user.full_name ?? '',
        delivery_unit: user.delivery_unit ?? '',
        designation: user.designation ?? '',
        task_description: user.task_description ?? '',
        password: '',
        password_confirmation: '',
    });

    const showSuccess = (status: string): void => {
        setMessage(status);
        setSuccessDialog(true);
    };

    const handleValidationError = (error: AxiosError<ValidationErrorResponse>): void => {
        setErrors(error.response?.data?.errors ?? {});
    };

    const updateProfile = (): void => {
        setIsSaving(true);

        axios
            .post<{ status: string }>('/update-profile', {
                username: item.username,
                full_name: item.full_name,
                delivery_unit: item.delivery_unit,
                designation: item.designation,
                task_description: item.task_description,
            })
            .then((response) => {
                showSuccess(response.data.status);
            })
            .catch((error: AxiosError<ValidationErrorResponse>) => {
                handleValidationError(error);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const updatePassword = (): void => {
        setIsSaving(true);

        axios
            .post<{ status: string }>('/update-password', {
                password: item.password,
                password_confirmation: item.password_confirmation,
            })
            .then((response) => {
                setItem((current) => ({
                    ...current,
                    password: '',
                    password_confirmation: '',
                }));
                showSuccess(response.data.status);
            })
            .catch((error: AxiosError<ValidationErrorResponse>) => {
                handleValidationError(error);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    return (
        <>
            <Head title="Settings" />

            <div className="flex min-h-0 flex-1 flex-col gap-5 ">
                <section className="rounded-lg border border-sky-200 bg-white px-5 py-4 shadow-sm bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                            <Settings className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-sky-50">Settings</h1>
                            <p className="text-sm text-slate-100">Manage your profile and password settings.</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
                    <aside className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <Avatar className="size-28 border border-sky-200">
                                <AvatarFallback className="bg-sky-100 text-3xl font-semibold text-sky-700">
                                    {getInitials(item.full_name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-slate-900">{item.full_name}</p>
                                <p className="truncate text-sm font-medium text-sky-700">@{item.username}</p>
                                <p className="mt-1 truncate text-sm text-slate-500">{item.designation}</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-2 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Delivery Unit</span>
                                <span className="font-medium text-slate-800">{item.delivery_unit}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-500">Role</span>
                                <span className="font-medium text-slate-800">{formatUserRole(user.role)}</span>
                            </div>
                        </div>
                    </aside>

                    <section className="rounded-lg border border-sky-200 bg-white shadow-sm">
                        <div className="flex gap-2 border-b border-sky-100 px-5 pt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                                    activeTab === 'profile'
                                        ? 'border-sky-600 text-sky-700'
                                        : 'border-transparent text-slate-500 hover:text-sky-700'
                                }`}
                            >
                                <UserRound className="size-4" />
                                Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('password')}
                                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                                    activeTab === 'password'
                                        ? 'border-sky-600 text-sky-700'
                                        : 'border-transparent text-slate-500 hover:text-sky-700'
                                }`}
                            >
                                <KeyRound className="size-4" />
                                Password
                            </button>
                        </div>

                        {activeTab === 'profile' && (
                            <div className="grid gap-5 p-5 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        value={item.full_name}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.full_name ?? ''} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={item.username}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.username ?? ''} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="delivery_unit">Delivery Unit</Label>
                                    <Input
                                        id="delivery_unit"
                                        name="delivery_unit"
                                        value={item.delivery_unit}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.delivery_unit ?? ''} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Input
                                        id="designation"
                                        name="designation"
                                        value={item.designation}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.designation ?? ''} />
                                </div>

                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="task_description">Task Description</Label>
                                    <Input
                                        id="task_description"
                                        name="task_description"
                                        value={item.task_description}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.task_description ?? ''} />
                                </div>

                                <div className="md:col-span-2">
                                    <Button
                                        type="button"
                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                        onClick={updateProfile}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Spinner /> : <Save className="size-4" />}
                                        Save Profile
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="grid gap-5 p-5 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={item.password}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.password ?? ''} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        value={item.password_confirmation}
                                        onChange={handleChange}
                                        className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                    />
                                    <InputError message={errors.password_confirmation ?? ''} />
                                </div>

                                <div className="md:col-span-2">
                                    <Button
                                        type="button"
                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                        onClick={updatePassword}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Spinner /> : <Save className="size-4" />}
                                        Save Password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <ConfirmationDialog
                show={successDialog}
                onClose={() => setSuccessDialog(false)}
                type={1}
                message={message}
            />
        </>
    );
}

SettingsPage.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;

export default SettingsPage;
