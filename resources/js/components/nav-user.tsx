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
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Crown, LogOut, MessageCircle } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group w-full flex-col items-start gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-left text-white shadow-[0_26px_70px_-50px_rgba(249,115,22,0.4)] transition group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:border-white/20 group-data-[collapsible=icon]:bg-white/10 group-data-[collapsible=icon]:p-0 hover:border-amber-400/30 hover:bg-white/10 data-[state=open]:bg-white/10"
                            data-test="sidebar-menu-button"
                        >
                            <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center">
                                <UserInfo
                                    user={auth.user}
                                    collapseDetailsOnSidebar={true}
                                />
                                <div
                                    aria-hidden
                                    className="ml-auto flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition group-hover:border-white/30 group-hover:text-white group-data-[collapsible=icon]:hidden"
                                >
                                    <LogOut className="size-4" />
                                </div>
                            </div>
                            <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[0.65rem] tracking-[0.3em] text-white/45 uppercase group-data-[collapsible=icon]:hidden">
                                <div className="flex items-center gap-2 text-white/55">
                                    <Crown className="size-3 text-amber-300" />
                                    <span>
                                        Scene ID #
                                        {String(auth.user.id).padStart(4, '0')}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.6rem] font-semibold text-white/80">
                                    <MessageCircle className="size-3.5" />
                                    <span className="tracking-[0.25em]">
                                        Open DMs
                                    </span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
        </SidebarMenu>
    );
}
