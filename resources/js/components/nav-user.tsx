import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

export function NavUser() {
    const { auth, support } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const supportEmail = support?.email || '';
    const contactUrl = support?.contact_url || '';
    const getInitials = useInitials();
    
    const user = auth.user;
    const displayName =
        user.display_name ?? user.name ?? user.username ?? 'Member';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-white transition group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0 hover:bg-white/5 data-[state=open]:bg-white/5"
                            data-test="sidebar-menu-button"
                        >
                            <Avatar className="h-8 w-8 shrink-0 overflow-hidden rounded-full group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
                                {(user.avatar_url || user.avatar) ? (
                                    <AvatarImage 
                                        src={(user.avatar_url || user.avatar) as string} 
                                        alt={displayName} 
                                    />
                                ) : null}
                                <AvatarFallback className="rounded-full bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-sm font-semibold text-white">
                                    {getInitials(displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-white">
                                        {displayName}
                                    </div>
                                </div>
                                <ChevronDown className="size-4 shrink-0 text-white/50 transition-transform group-data-[state=open]:rotate-180" />
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl p-2 shadow-[0_24px_60px_-35px_rgba(249,115,22,0.45)]"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-[0.65rem] tracking-[0.2em] text-white/50 uppercase">
                    <Link
                        href="/legal"
                        className="transition-colors hover:text-white/80"
                    >
                        Legal
                    </Link>
                    {contactUrl && (
                        <a
                            href={contactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-white/80"
                        >
                            Support
                        </a>
                    )}
                    {supportEmail && (
                        <a
                            href={`mailto:${supportEmail}`}
                            className="transition-colors hover:text-white/80"
                        >
                            Contact
                        </a>
                    )}
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
