import AuthLayout from '@/layouts/auth-layout';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { useHandleChange } from '@/hooks/use-handle-change';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Eye,
    EyeOff,
    LockKeyhole,
    ShieldCheck,
    UserCircle2,
} from 'lucide-react';
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
        <form
            className="space-y-6"
            onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
            }}
        >
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Label
                        htmlFor="username"
                        className="text-sm font-semibold text-sky-900"
                    >
                        Username
                    </Label>
                    <div className="group relative">
                        <UserCircle2 className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            required
                            autoComplete="username"
                            placeholder="Enter your username"
                            onChange={handleChange}
                            value={item.username ?? ''}
                            className="h-13.5 rounded-2xl border-sky-200 bg-white pr-4 pl-12 text-sky-950 shadow-none focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                    </div>
                    <InputError message={errors.username ?? ''} />
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="password"
                        className="text-sm font-semibold text-sky-900"
                    >
                        Password
                    </Label>
                    <div className="group relative">
                        <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-sky-400 transition-colors group-focus-within:text-sky-600" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            onChange={handleChange}
                            value={item.password ?? ''}
                            className="h-13.5 rounded-2xl border-sky-200 bg-white pr-14 pl-12 text-sky-950 shadow-none focus-visible:border-sky-500 focus-visible:ring-sky-100"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((current) => !current)
                            }
                            className="absolute top-1/2 right-4 inline-flex -translate-y-1/2 items-center justify-center text-sky-300 transition hover:text-sky-600"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password ?? ''} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                    <label
                        htmlFor="showPassword"
                        className="flex cursor-pointer items-center gap-3"
                    >
                        <Checkbox
                            id="showPassword"
                            checked={Boolean(showPassword)}
                            onCheckedChange={(checked: boolean) =>
                                setShowPassword(Boolean(checked))
                            }
                            className="size-5 rounded-md border-sky-300 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-500"
                        />
                        <span className="text-sm font-medium text-sky-800">
                            Show password
                        </span>
                    </label>

                    <div className="hidden items-center gap-2 text-xs font-medium text-sky-700 sm:flex">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Protected login
                    </div>
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-sky-600 text-sm font-bold tracking-[0.18em] text-white uppercase shadow-md shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-700 disabled:translate-y-0 disabled:opacity-90"
                    disabled={loading}
                >
                    {loading && <Spinner className="mr-2" />}
                    {loading ? 'Opening workspace...' : 'Sign in'}
                </Button>

                <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                    <div className="rounded-full bg-white p-1.5 text-sky-600 shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p>
                        Access is limited to authorized team members responsible
                        for content uploads and workflow review.
                    </p>
                </div>
            </div>
        </form>
    );
}

AuthPage.layout = (page: React.ReactNode) => <AuthLayout children={page} />;
export default AuthPage;
