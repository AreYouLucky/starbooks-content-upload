import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps, SharedData } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-sky-50 px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col overflow-hidden p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-sky-900" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    {name}
                </Link>
                <div className="relative z-20 mt-auto max-w-md space-y-3">
                    <p className="text-sm font-semibold tracking-[0.18em] text-sky-100/85 uppercase">
                        STARBOOKS Workspace
                    </p>
                    <h2 className="text-3xl leading-tight font-semibold text-white">
                        Clean, bright workflow management for content review and
                        publishing.
                    </h2>
                    <p className="text-sm leading-6 text-sky-100/90">
                        A lighter white and sky palette keeps the workspace calm
                        while still making primary actions clear.
                    </p>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-6 rounded-[2rem] border border-sky-200 bg-white p-8 shadow-lg shadow-sky-100/60 sm:w-[420px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-sky-700 sm:h-12" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium text-sky-950">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
