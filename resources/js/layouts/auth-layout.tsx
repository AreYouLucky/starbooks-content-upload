import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { Toaster } from 'sonner';
export default function AuthLayout({
    children,
    ...props
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate {...props}>
            <Toaster />
            {children}
        </AuthLayoutTemplate>
    );
}
