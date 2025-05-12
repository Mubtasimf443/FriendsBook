/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useId } from 'react';
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,

    UserCheck,
    MessageSquare,
    Mail,
    LogOut,

    UserPlus,
    HeartHandshake,
    Star,
    User,
    UserRoundSearch,
    UsersRound,
    LayoutDashboardIcon,
    ChartBarIcon,
    StarIcon,

    MessageCircleIcon,
    InboxIcon,

} from 'lucide-react';
import SideBarLinksSection from './SideBarLinksSection';
import SideBarNavLink from './SideBarNavLink';

const Sidebar = () => {
    return (
        <div className="flex flex-col bg-white border-r w-64 h-dvh overflow-y-scroll scroll-smooth no-scrollbar">
            <div className="px-3 py-4 flex-1">
                {/* Overview Section */}


                <SideBarNavLink
                    icon={LayoutDashboard}
                    label={"Dashboard overview"}
                    href={"/dashboard/overview"}
                    description={"Dashboard overview"}
                />

                <Separator className="my-4" />

                {/* User Management Section */}
                <SideBarLinksSection
                    icon={UsersRound}
                    title="USER MANAGEMENT"
                    route="/dashboard/users/all"
                    id={useId()}
                    routes={[
                        {
                            label: "All Users",
                            href: "/dashboard/users/all",
                            icon: User,
                            description: "Manage all users"
                        },

                        {
                            label: "Search Users",
                            href: "/dashboard/users/search-by-id",
                            icon: UserRoundSearch,
                            description: "Search Users By Id"
                        }
                    ]}
                />

                {/* Membership Section */}
                <SideBarLinksSection
                    icon={StarIcon}
                    title="MEMBERSHIP"
                    route="/dashboard/membership"
                    id={useId()}
                    routes={[
                        {
                            label: "Membership Requests",
                            href: "/dashboard/membership",
                            icon: UserCheck,
                            badge: {
                                text: "5",
                                variant: "destructive"
                            },
                            description: "Pending requests"
                        },
                        {
                            label: "Premium Members",
                            href: "/dashboard/membership/premium",
                            icon: Star,
                            description: "Premium users"
                        }
                    ]}
                />

                {/* Feedback Section */}
                <SideBarLinksSection
                    icon={MessageCircleIcon}
                    title="FEEDBACK"
                    route="/dashboard/feedback"
                    id={useId()}
                    routes={[
                        {
                            label: "User Feedback",
                            href: "/dashboard/feedback",
                            icon: MessageSquare,
                            badge: {
                                text: "New",
                                variant: "default"
                            },
                            description: "User reviews and reports"
                        }
                    ]}
                />

                {/* Contact Section */}
                <SideBarLinksSection
                    icon={InboxIcon}
                    title="CONTACT"
                    route="/dashboard/contact"
                    id={useId()}
                    routes={[
                        {
                            label: "All Contacts",
                            href: "/dashboard/contact",
                            icon: Mail,
                            badge: {
                                text: "3",
                                variant: "destructive"
                            },
                            description: "User messages"
                        },

                    ]}
                />

                <Separator className="my-4" />

                {/* Logout Section */}
              

                 <SideBarNavLink
                    icon={LogOut}
                    label={"Logout"}
                    href={"/loggout"}
                    description={"Sign out of admin panel"}
                />

            </div>
        </div>
    );
};

export default Sidebar;