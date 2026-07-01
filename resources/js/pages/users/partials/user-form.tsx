import { memo, useCallback, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useHandleChange } from '@/hooks/use-handle-change';
import { userRoleOptions } from '@/lib/user-roles';
import { type User } from '@/types';

import { useCreateUser, useUpdateUser } from './user-hooks';

type UserFormProps = {
    show: boolean;
    onClose: () => void;
    data?: User;
};

const defaultForm = {
    id: 0,
    username: '',
    full_name: '',
    delivery_unit: '',
    role: 'stii_admin',
    designation: '',
    task_description: '',
    password: '',
    password_confirmation: '',
};

function UserForm({ show, onClose, data }: UserFormProps) {
    const { item, errors, handleChange, setErrors, setItem } = useHandleChange(defaultForm);
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const isUpdating = item.id !== 0;
    const isSaving = createUser.isPending || updateUser.isPending;

    const resetForm = useCallback((): void => {
        setItem(defaultForm);
        setErrors({});
    }, [setErrors, setItem]);

    const closeForm = (): void => {
        resetForm();
        onClose();
    };

    const createFormData = (): FormData => {
        const formData = new FormData();

        formData.append('username', item.username);
        formData.append('full_name', item.full_name);
        formData.append('delivery_unit', item.delivery_unit);
        formData.append('role', item.role);
        formData.append('designation', item.designation);
        formData.append('task_description', item.task_description);

        if (!isUpdating) {
            formData.append('password', item.password);
            formData.append('password_confirmation', item.password_confirmation);
        }

        return formData;
    };

    const saveUser = (): void => {
        const payload = createFormData();

        if (isUpdating) {
            updateUser.mutate(
                { id: item.id, payload },
                {
                    onSuccess: () => {
                        toast.success('Account updated successfully.');
                        closeForm();
                    },
                    onError: (error) => {
                        setErrors(error.response?.data?.errors ?? {});
                        toast.error('Check fields for errors.');
                    },
                },
            );

            return;
        }

        createUser.mutate(payload, {
            onSuccess: () => {
                toast.success('Account created successfully.');
                closeForm();
            },
            onError: (error) => {
                setErrors(error.response?.data?.errors ?? {});
                toast.error('Check fields for errors.');
            },
        });
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        if (data?.id) {
            setItem({
                id: data.id,
                username: data.username ?? '',
                full_name: data.full_name ?? '',
                delivery_unit: data.delivery_unit ?? '',
                role: data.role ?? '',
                designation: data.designation ?? '',
                task_description: data.task_description ?? '',
                password: '',
                password_confirmation: '',
            });
            setErrors({});
            return;
        }

        resetForm();
    }, [data, resetForm, setErrors, setItem, show]);

    return (
        <Dialog
            open={show}
            onOpenChange={(open) => {
                if (!open) {
                    closeForm();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto border-sky-200 bg-white p-0 sm:max-w-3xl">
                <DialogHeader className="bg-linear-to-br from-sky-600 via-sky-500 to-cyan-500  px-6 py-5">
                    <DialogTitle className="text-lg font-semibold text-sky-50">
                        {isUpdating ? 'Update Account' : 'Create Account'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-100">
                        Use a username for access. Email is not required for reviewer accounts.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name" className="text-slate-700">
                            Full Name
                        </Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            required
                            value={item.full_name}
                            onChange={handleChange}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.full_name ?? ''} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username" className="text-slate-700">
                            Username
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            required
                            value={item.username}
                            onChange={handleChange}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.username ?? ''} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="delivery_unit" className="text-slate-700">
                            Delivery Unit
                        </Label>
                        <Input
                            id="delivery_unit"
                            name="delivery_unit"
                            required
                            value={item.delivery_unit}
                            onChange={handleChange}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.delivery_unit ?? ''} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role" className="text-slate-700">
                            Role
                        </Label>
                        <select
                            id="role"
                            name="role"
                            required
                            value={item.role}
                            onChange={handleChange}
                            className="border-input flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-sky-500 focus-visible:ring-[3px] focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        >
                            {userRoleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.role ?? ''} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="designation" className="text-slate-700">
                            Designation
                        </Label>
                        <Input
                            id="designation"
                            name="designation"
                            required
                            value={item.designation}
                            onChange={handleChange}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.designation ?? ''} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="task_description" className="text-slate-700">
                            Task Description
                        </Label>
                        <Input
                            id="task_description"
                            name="task_description"
                            required
                            value={item.task_description}
                            onChange={handleChange}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.task_description ?? ''} />
                    </div>

                    {!isUpdating && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-slate-700">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={item.password}
                                    onChange={handleChange}
                                    className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                />
                                <InputError message={errors.password ?? ''} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="text-slate-700">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    required
                                    value={item.password_confirmation}
                                    onChange={handleChange}
                                    className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                                />
                                <InputError message={errors.password_confirmation ?? ''} />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-sky-100 bg-slate-50 px-6 py-4">
                    <Button type="button" variant="outline" onClick={closeForm}>
                        Cancel
                    </Button>
                    <Button type="button" className="bg-sky-600 text-white hover:bg-sky-700" onClick={saveUser} disabled={isSaving}>
                        {isSaving ? <Spinner /> : <Save className="size-4" />}
                        {isUpdating ? 'Update Account' : 'Create Account'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default memo(UserForm);
