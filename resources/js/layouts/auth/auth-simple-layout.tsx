import AppLogoIcon from '@/components/app-logo-icon';
import { type AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sky-200 px-6 py-10 md:px-10 md:py-15">
            <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white px-10 py-18 shadow-lg shadow-sky-100/70">
                <div className="flex flex-col gap-2 px-3">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex items-center justify-center rounded-md">
                                <AppLogoIcon className="h-10 fill-current text-sky-700" />
                            </div>
                        </div>

                        <div className="space-y-1 text-center">
                            <h1 className="mb-2 text-base font-bold tracking-[0.15em] text-sky-900 uppercase">
                                 Content Review and Approval Portal
                            </h1>
                           
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
