import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.full_name} />
                <AvatarFallback className="rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-100">
                    {getInitials(user.full_name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight text-sky-900">
                <span className="truncate font-medium">{user.full_name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.designation}
                    </span>
                )}
            </div>
        </>
    );
}
