import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    className,
    collapseDetailsOnSidebar = false,
}: {
    user: User;
    showEmail?: boolean;
    className?: string;
    collapseDetailsOnSidebar?: boolean;
}) {
    const getInitials = useInitials();
    const avatar =
        (user.avatar_url && user.avatar_url.length > 0 && user.avatar_url) ||
        (user.avatar && user.avatar.length > 0 && user.avatar) ||
        (Reflect.has(user, 'avatar_path') &&
        typeof (user as Record<string, unknown>).avatar_path === 'string' &&
        ((user as Record<string, string>).avatar_path?.length ?? 0) > 0
            ? ((user as Record<string, string>).avatar_path as string)
            : null);
    const displayName =
        user.display_name ?? user.name ?? user.username ?? 'Member';

    return (
        <div className={cn('flex min-w-0 items-center gap-3', className)}>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(displayName)}
                </AvatarFallback>
            </Avatar>
            <div
                className={cn(
                    'grid flex-1 text-left text-sm leading-tight',
                    collapseDetailsOnSidebar &&
                        'group-data-[collapsible=icon]:hidden',
                )}
            >
                <span className="truncate font-medium">{displayName}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </div>
    );
}
