import AppLogoIcon from '@/components/app-logo-icon';
import { type AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#c7efffb7] px-6 md:px-10 py-10 md:py-15">
            <div className="w-full max-w-lg bg-white shadow-lg px-10 py-18 rounded-2xl border">
                <div className="flex flex-col gap-2 px-3">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex items-center justify-center rounded-md">
                                <AppLogoIcon className="h-10" />
                            </div>
                        </div>

                        <div className="space-y-1 text-center">
                            <h1 className="text-base font-bold uppercase text-gray-700 mb-2"> Content Management</h1>
                        </div>
                        
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
