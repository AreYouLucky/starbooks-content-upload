import { memo, useCallback } from 'react';
import { KeyRound, Save } from 'lucide-react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useHandleChange } from '@/hooks/use-handle-change';

import { useChangeUserPassword } from './user-hooks';

type PasswordFormProps = {
    show: boolean;
    onClose: () => void;
    id: number;
};

function PasswordForm({ show, onClose, id }: PasswordFormProps) {
    const { item, errors, handleChange, setErrors, setItem } = useHandleChange({
        password: '',
        password_confirmation: '',
    });
    const changeUserPassword = useChangeUserPassword();

    const closeForm = useCallback((): void => {
        setItem({ password: '', password_confirmation: '' });
        setErrors({});
        onClose();
    }, [onClose, setErrors, setItem]);

    const changeUserPasswordFn = (): void => {
        const formData = new FormData();
        formData.append('password', item.password);
        formData.append('password_confirmation', item.password_confirmation);

        changeUserPassword.mutate(
            { id, payload: formData },
            {
                onSuccess: () => {
                    toast.success('Password updated successfully.');
                    closeForm();
                },
                onError: (error) => {
                    setErrors(error.response?.data?.errors ?? {});
                    toast.error('Check fields for errors.');
                },
            },
        );
    };

    return (
        <Dialog
            open={show}
            onOpenChange={(open) => {
                if (!open) {
                    closeForm();
                }
            }}
        >
            <DialogContent className="border-sky-200 bg-white p-0 sm:max-w-md">
                <DialogHeader className="border-b border-sky-100 bg-sky-50 px-6 py-5">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-sky-950">
                        <KeyRound className="size-5 text-sky-600" />
                        Change Password
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Set a new password for this username account.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-slate-700">
                            New Password
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            onChange={handleChange}
                            value={item.password}
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
                            onChange={handleChange}
                            value={item.password_confirmation}
                            className="border-gray-300 focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <InputError message={errors.password_confirmation ?? ''} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-sky-100 bg-slate-50 px-6 py-4">
                    <Button type="button" variant="outline" onClick={closeForm}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-sky-600 text-white hover:bg-sky-700"
                        onClick={changeUserPasswordFn}
                        disabled={changeUserPassword.isPending}
                    >
                        {changeUserPassword.isPending ? <Spinner /> : <Save className="size-4" />}
                        Save Password
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default memo(PasswordForm);
