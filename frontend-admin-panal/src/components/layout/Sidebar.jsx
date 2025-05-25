/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React, { useId } from 'react';
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    UserCheck,
    LogOut,
    User,
    UserRoundSearch,
    StarIcon,
    Bell,
    DollarSign,
    Gift
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
                    href={"/admin/overview"}
                    description={"Dashboard overview"}
                />

                <Separator className="my-4" />

                {/* User Management Section */}
               

                <SideBarNavLink
                    icon={User}
                    label={"All Users"}
                    href={"/admin/users/all"}
                    description={"Manage all users"}
                />

                <SideBarNavLink
                    icon={UserRoundSearch}
                    label={"Search Users"}
                    href={"/admin/users/search"}
                    description={"Search Users By Id"}
                />

                <SideBarNavLink
                    icon={StarIcon}
                    label={"Membership"}
                    href={"/admin/memberships-management"}
                    description={"Membership management"}
                />

                <SideBarNavLink
                    icon={UserCheck}
                    label={"Membership Requests"}
                    href={"/admin/membership-request"}
                    description={"Pending requests"}
                   
                />
                
                
                <SideBarNavLink
                    icon={UserCheck}
                    label={"Coin Requests"}
                    href={"/admin/coin-request"}
                    description={"Pending requests"}
                  
                />
                
                {/* <SideBarNavLink
                    icon={Bell}
                    label={"Push Notifications"}
                    href={"/admin/notifications"}
                    description={"Create and manage notifications"}
                /> */}

                <SideBarNavLink
                    icon={Gift}
                    label={"Gifts"}
                    href={"/admin/gift-management"}
                    description={"Manage video currency settings"}
                />


                <SideBarNavLink
                    icon={DollarSign}
                    label={"Coins"}
                    href={"/admin/coin-management"}
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