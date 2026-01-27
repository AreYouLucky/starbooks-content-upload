import AppLogoIcon from '@/components/app-logo-icon';
import { type AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-(--foreground) dark:text-white" />
                            </div>
                            <span className="sr-only">STARBOOKS Content Management</span>
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">STARBOOKS Content Management</h1>
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
