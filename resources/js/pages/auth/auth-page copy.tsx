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
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-center shadow-sm">
                    <Sparkles className="mx-auto mb-2 h-5 w-5 text-sky-500" />
                    <p className="text-xs font-bold tracking-[0.2em] text-sky-600 uppercase">
                        Bright
                    </p>
                    <p className="text-sm text-slate-600">Friendly workspace</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center shadow-sm">
                    <Star className="mx-auto mb-2 h-5 w-5 text-amber-500" />
                    <p className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase">
                        Playful
                    </p>
                    <p className="text-sm text-slate-600">
                        Kid-first content vibe
                    </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-center shadow-sm sm:col-span-1">
                    <BadgeCheck className="mx-auto mb-2 h-5 w-5 text-emerald-500" />
                    <p className="text-xs font-bold tracking-[0.2em] text-emerald-600 uppercase">
                        Ready
                    </p>
                    <p className="text-sm text-slate-600">Secure team access</p>
                </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-100 via-white to-amber-100 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-200">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">
                            Welcome back, creator!
                        </p>
                        <p className="text-xs text-slate-500">
                            Sign in to continue building colorful learning
                            content.
                        </p>
                    </div>
                </div>

                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="username"
                            className="text-sm font-bold text-slate-700"
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
                            className="h-12 rounded-2xl border-sky-100 bg-sky-50/70 px-4 text-slate-700 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/70"
                        />
                        <InputError message={errors.username ?? ''} />
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="password"
                            className="text-sm font-bold text-slate-700"
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
                            className="h-12 rounded-2xl border-amber-100 bg-amber-50/70 px-4 text-slate-700 placeholder:text-slate-400 focus-visible:border-amber-300 focus-visible:ring-amber-200/70"
                        />
                        <InputError message={errors.password ?? ''} />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700">
                                Show password
                            </p>
                            <p className="text-xs text-slate-500">
                                Helpful when signing in on shared content desks.
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

                    <Button
                        type="submit"
                        className="mt-1 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#22c55e_100%)] text-base font-bold text-white shadow-[0_18px_35px_rgba(14,165,233,0.28)] transition-transform hover:-translate-y-0.5 hover:opacity-95"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading && <Spinner className="mr-2" />}
                        {loading
                            ? 'Opening your workspace...'
                            : 'Log in to STARBOOKS'}
                    </Button>

                    <p className="text-center text-xs leading-5 text-slate-500">
                        Safe, simple, and made to keep your content journey
                        cheerful from the very first click.
                    </p>
                </div>
            </div>
        </div>
    );
}

AuthPage.layout = (page: React.ReactNode) => <AuthLayout children={page} />;
export default AuthPage;
