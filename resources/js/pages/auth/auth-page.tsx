import AuthLayout from '@/layouts/auth-layout';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { useHandleChange } from '@/hooks/use-handle-change';
import { Checkbox } from '@/components/ui/checkbox';
import { BadgeCheck, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

function AuthPage() {
    const { item, errors, handleChange, setErrors } = useHandleChange({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const handleSubmit = () => {
        setLoading(true);
        axios
            .post('/request-login', item)
            .then((res) => {
                toast.success(res.data.status);
                window.location.href = '/dashboard';
                setLoading(false);
            })
            .catch((err) => {
                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                }
                toast.error('Invalid Credentials');
                setLoading(false);
            });
    };
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="space-y-6 pb-4 px-3">
            <div className="py-2">

                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="username"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Username
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            required
                            autoComplete="username"
                            placeholder="Type your username"
                            onChange={handleChange}
                            value={item.username ?? ''}
                            className="h-12 rounded-lg border-sky-300 bg-sky-50/70 px-4 text-slate-700 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/70"
                        />
                        <InputError message={errors.username ?? ''} />
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Password
                        </Label>
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            autoComplete="current-password"
                            placeholder="Type your password"
                            onChange={handleChange}
                            value={item.password ?? ''}
                            className="h-12 rounded-lg border-sky-300 bg-sky-50/70 px-4 text-slate-700 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/70"
                        />
                        <InputError message={errors.password ?? ''} />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl  px-2">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-700">
                                Show password
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="showPassword"
                                checked={Boolean(showPassword)}
                                onCheckedChange={(checked: boolean) =>
                                    setShowPassword(Boolean(checked))
                                }
                                className="size-5 rounded-xl border-sky-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-500"
                            />
                        </div>
                    </div>
                    <div className='px-10 pb-3 pt-3'>
                        <Button
                            type="submit"
                            className="mt-1 h-11 uppercase w-full rounded-2xl  bg-[#00aeef]  text-base font-bold text-white  transition-transform hover:-translate-y-0.5 hover:opacity-95"
                            disabled={loading}
                            onClick={handleSubmit}
                        >
                            {loading && <Spinner className="mr-2" />}
                            {loading
                                ? 'Opening your workspace...'
                                : 'Log in'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

AuthPage.layout = (page: React.ReactNode) => <AuthLayout children={page} />;
export default AuthPage;
