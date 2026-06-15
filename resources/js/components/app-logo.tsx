import { Link } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <Link
            href="/dashboard"
            className="flex h-10 w-full items-center rounded-lg px-1.5 transition-colors outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="STARBOOKS dashboard"
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-xs font-bold text-white shadow-sm group-data-[collapsible=icon]:flex">
                    S
                </div>
                <AppLogoIcon className="h-auto w-44 group-data-[collapsible=icon]:hidden" />
            </div>
        </Link>
    );
}
