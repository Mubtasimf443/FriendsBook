/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useId } from 'react';
import { Separator } from "@/components/ui/separator";
import SideBarNavLink from './SideBarNavLink';
import { 
    LayoutDashboard, 
    Users, 
    UserCheck,
    MessageSquare,
    Mail,
    LogOut,
    BarChart2,
    UserPlus,
    HeartHandshake,
    Star,
    User2Icon,
    User,
    UserRoundSearch,
    UsersRound,
} from 'lucide-react';
import SideBarLinksSection from './SideBarLinksSection';

const Sidebar = () => {
    return (
        <div className="flex flex-col bg-white border-r w-64 h-dvh overflow-y-scroll scroll-smooth no-scrollbar">
            <div className="px-3 py-4 flex-1">
                {/* Overview Section */}
                <div className="space-y-1">

                    <SideBarNavLink 
                        label="Overview" 
                        href="/dashboard/overview" 
                        icon={LayoutDashboard}
                        description="Dashboard overview"
                    />

                </div>

                <Separator className="my-4" />

                {/* User Management Section */}

                <SideBarLinksSection
                    icon={UsersRound}
                    title={"USER MANAGEMENT"}
                    route={'/users'}
                    id={useId()}
                    routes={
                        [
                            {
                                label: "All Users",
                                href: "users/all",
                                icon: User,
                                description: "Manage all users"
                            },
                            {
                                label: "New Users",
                                href: "users/new",
                                icon:UserPlus,
                                description: "Manage new users"
                            },
                            {
                                label: "Search Users",
                                href: "users/search-by-id",
                                icon:UserRoundSearch,
                                description: "Search Users By Id"
                            },
                        ]
                    }
                />

                <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        USER MANAGEMENT
                    </p>
                 
                </div>

                {/* Membership Section */}
                <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        MEMBERSHIP
                    </p>
                    <SideBarNavLink 
                        label="Membership Requests" 
                        href="/dashboard/membership" 
                        icon={UserCheck}
                        badge={{
                            text: "5",
                            variant: "destructive"
                        }}
                        description="Pending requests"
                    />
                    <SideBarNavLink 
                        label="Premium Members" 
                        href="/dashboard/membership/premium" 
                        icon={Star}
                        description="Premium users"
                    />
                </div>

                {/* Feedback Section */}
                <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        FEEDBACK
                    </p>
                    <SideBarNavLink 
                        label="User Feedback" 
                        href="/dashboard/feedback" 
                        icon={MessageSquare}
                        badge={{
                            text: "New",
                            variant: "default"
                        }}
                        description="User reviews and reports"
                    />
                </div>

                {/* Contact Section */}
                <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                        CONTACT
                    </p>
                    <SideBarNavLink 
                        label="Messages" 
                        href="/dashboard/contact" 
                        icon={Mail}
                        badge={{
                            text: "3",
                            variant: "destructive"
                        }}
                        description="User messages"
                    />
                    <SideBarNavLink 
                        label="Support" 
                        href="/dashboard/contact/support" 
                        icon={HeartHandshake}
                        description="Help and support"
                    />
                </div>

                <Separator className="my-4" />

                {/* Logout */}
                <SideBarNavLink 
                    label="Logout" 
                    href="/loggout" 
                    icon={LogOut}
                    description="Sign out of admin panel"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                />
            </div>
        </div>
    );
};

export default Sidebar;