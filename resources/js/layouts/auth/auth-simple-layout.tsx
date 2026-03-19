import AppLogoIcon from '@/components/app-logo-icon';
import { type AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-t from-[#ffffffc2] to-[#00afefb7] p-6 md:p-10">
            <div className="w-full max-w-md bg-white shadow-lg px-10 py-10 rounded-xl border">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex items-center justify-center rounded-md">
                                <AppLogoIcon className="h-10" />
                            </div>
                        </div>

                        <div className="space-y-1 text-center">
                            <h1 className="text-base inc-extrabold uppercase text-gray-500"> Content Management</h1>
                            <p className="text-center text-sm text-muted-foreground">
                               Sign in to your account
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
