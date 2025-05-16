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
    Bell,
    DollarSign,

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
               

                <SideBarNavLink
                    icon={User}
                    label={"All Users"}
                    href={"/dashboard/users/all"}
                    description={"Manage all users"}
                />

                <SideBarNavLink
                    icon={UserRoundSearch}
                    label={"Search Users"}
                    href={"/dashboard/users/search-by-id"}
                    description={"Search Users By Id"}
                />

                <SideBarNavLink
                    icon={StarIcon}
                    label={"Membership"}
                    href={"/dashboard/memberships-management"}
                    description={"Membership management"}
                />

                <SideBarNavLink
                    icon={UserCheck}
                    label={"Membership Requests"}
                    href={"/dashboard/membership-request"}
                    description={"Pending requests"}
                    badge={{
                        text: "5",
                        variant: "destructive"
                    }}
                />

             
                
                <SideBarNavLink
                    icon={Bell}
                    label={"Push Notifications"}
                    href={"/dashboard/notifications"}
                    description={"Create and manage notifications"}
                />

                <SideBarNavLink
                    icon={DollarSign}
                    label={"Video Diamonds"}
                    href={"/dashboard/video-currency"}
                    description={"Manage video currency settings"}
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