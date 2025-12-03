import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const getInitials = useInitials();

    const displayName =
        user.display_name ?? user.name ?? user.username ?? 'Member';
    const avatar = user.avatar_url || user.avatar;

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-3">
                    <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        {avatar ? (
                            <AvatarImage src={avatar} alt={displayName} />
                        ) : null}
                        <AvatarFallback className="rounded-full bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-sm font-semibold text-white">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">
                            {displayName}
                        </div>
                        <div className="truncate text-xs text-white/60">
                            {user.email}
                        </div>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white transition-colors hover:bg-white/10 focus:bg-white/10"
                        href="/settings"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="size-4 text-white/80" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild>
                <Link
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white transition-colors hover:bg-white/10 focus:bg-white/10"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="size-4 text-white/80" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
